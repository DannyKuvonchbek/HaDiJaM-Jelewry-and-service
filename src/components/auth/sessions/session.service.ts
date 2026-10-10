import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { MemberStatus } from "../../../libs/enums/member.enum";
const IDLE_MS = 14 * 86400000;
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
@Injectable()
export class SessionService {
  constructor(
    @InjectModel("AuthSession") private sessions: Model<any>,
    @InjectModel("Member") private members: Model<any>,
    private jwt: JwtService,
  ) {}
  private denied(): never {
    throw new UnauthorizedException(
      "Your session has expired. Please sign in again.",
    );
  }
  // A cryptographically authenticated generation lets us detect reuse without an unbounded history array.
  private refreshValue(id: string, generation: number): string {
    const body = `${id}.${generation}`;
    const signature = createHmac("sha256", process.env.JWT_SECRET)
      .update(`refresh-v1:${body}`)
      .digest("base64url");
    return `${body}.${signature}`;
  }
  private parse(value: string): { id: string; generation: number } {
    const [id, raw, signature, extra] = value.split(".");
    if (
      extra ||
      !Types.ObjectId.isValid(id ?? "") ||
      !/^(0|[1-9][0-9]*)$/.test(raw ?? "") ||
      !signature
    )
      this.denied();
    const generation = Number(raw);
    if (!Number.isSafeInteger(generation)) this.denied();
    const expected = this.refreshValue(id, generation);
    const left = Buffer.from(value),
      right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right))
      this.denied();
    return { id, generation };
  }
  private async access(memberId: string, sid: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: memberId, sid },
      {
        expiresIn: 240,
        issuer: "hadijam-api",
        audience: "hadijam-web",
        algorithm: "HS256",
      },
    );
  }
  private async activeMember(memberId: string): Promise<any> {
    const member: any = await this.members.findById(memberId).lean();
    if (!member || member.memberStatus !== MemberStatus.ACTIVE) this.denied();
    return member;
  }
  async create(memberId: string) {
    await this.activeMember(memberId);
    const id = new Types.ObjectId().toString(),
      now = new Date(),
      expiresAt = new Date(now.getTime() + IDLE_MS);
    const refreshToken = this.refreshValue(id, 0);
    await this.sessions.create({
      _id: id,
      memberId,
      refreshHash: hash(refreshToken),
      generation: 0,
      lastActivityAt: now,
      expiresAt,
    });
    return {
      accessToken: await this.access(memberId, id),
      refreshToken,
      expiresAt,
    };
  }
  async authenticate(token: string): Promise<any> {
    let claims: any;
    try {
      claims = await this.jwt.verifyAsync(token, {
        issuer: "hadijam-api",
        audience: "hadijam-web",
        algorithms: ["HS256"],
      });
    } catch {
      this.denied();
    }
    if (
      !Types.ObjectId.isValid(claims?.sid ?? "") ||
      !Types.ObjectId.isValid(claims?.sub ?? "")
    )
      this.denied();
    const session: any = await this.sessions
      .findOne({
        _id: claims.sid,
        memberId: claims.sub,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
        lastActivityAt: { $gt: new Date(Date.now() - IDLE_MS) },
      })
      .lean();
    if (!session) this.denied();
    return { member: await this.activeMember(claims.sub), session, claims };
  }
  async refresh(value: string) {
    const { id, generation } = this.parse(value),
      now = new Date();
    const session: any = await this.sessions
      .findOne({
        _id: id,
        revokedAt: null,
        lastActivityAt: { $gt: new Date(now.getTime() - IDLE_MS) },
        expiresAt: { $gt: now },
      })
      .select("+refreshHash")
      .lean();
    if (!session) this.denied();
    if (generation < session.generation) {
      await this.revoke(id);
      this.denied();
    }
    if (
      generation !== session.generation ||
      hash(value) !== session.refreshHash
    )
      this.denied();
    const member = await this.activeMember(String(session.memberId));
    const refreshToken = this.refreshValue(id, generation + 1);
    const changed: any = await this.sessions
      .findOneAndUpdate(
        {
          _id: id,
          generation,
          refreshHash: hash(value),
          revokedAt: null,
          lastActivityAt: { $gt: new Date(now.getTime() - IDLE_MS) },
          expiresAt: { $gt: now },
        },
        {
          $set: {
            refreshHash: hash(refreshToken),
            expiresAt: new Date(
              Math.min(
                new Date(session.expiresAt).getTime(),
                new Date(session.lastActivityAt).getTime() + IDLE_MS,
              ),
            ),
          },
          $inc: { generation: 1 },
        },
        { new: true },
      )
      .lean();
    if (!changed) {
      await this.revoke(id);
      this.denied();
    }
    // Background refresh never extends inactivity expiry.
    return {
      member,
      accessToken: await this.access(String(member._id), id),
      refreshToken,
      expiresAt: changed.expiresAt,
    };
  }
  async activity(token: string, refresh: string) {
    const { session, claims } = await this.authenticate(token);
    const cookie = this.parse(refresh);
    if (
      cookie.id !== String(session._id) ||
      cookie.generation !== session.generation
    )
      this.denied();
    const now = new Date();
    if (now.getTime() - new Date(session.lastActivityAt).getTime() < 60000)
      return { refreshToken: refresh, expiresAt: session.expiresAt };
    const expiresAt = new Date(now.getTime() + IDLE_MS);
    const changed: any = await this.sessions
      .findOneAndUpdate(
        {
          _id: claims.sid,
          revokedAt: null,
          generation: cookie.generation,
          lastActivityAt: { $gt: new Date(now.getTime() - IDLE_MS) },
          expiresAt: { $gt: now },
        },
        { $set: { lastActivityAt: now, expiresAt } },
        { new: true },
      )
      .lean();
    if (!changed) this.denied();
    return { refreshToken: refresh, expiresAt: changed.expiresAt };
  }
  async revoke(id: string) {
    await this.sessions.updateOne(
      { _id: id },
      { $set: { revokedAt: new Date() } },
    );
  }
  async logout(refresh: string) {
    if (refresh) {
      const { id } = this.parse(refresh);
      await this.revoke(id);
    }
  }
  async revokeMember(memberId: string) {
    await this.sessions.updateMany(
      { memberId },
      { $set: { revokedAt: new Date() } },
    );
  }
}
