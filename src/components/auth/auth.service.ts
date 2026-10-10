import { SessionService } from './sessions/session.service';
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Member } from "../../libs/dto/member/member";
import { MemberStatus } from "../../libs/enums/member.enum";
import { Message } from "../../libs/enums/common.enum";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessions: SessionService,
    @InjectModel("Member") private readonly memberModel: Model<Member>,
  ) {}

  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  public async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  public async createSession(member: Member) { return this.sessions.create(String(member._id)); }
  public async revokeMember(memberId: string) { return this.sessions.revokeMember(memberId); }
  public async verifyToken(token: string): Promise<Member> { return this.getAuthenticatedMember(token); }
  public async getAuthenticatedMember(token: string): Promise<Member> {
    return (await this.sessions.authenticate(token)).member as Member;
  }
}
