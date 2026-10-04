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

  public async createToken(member: Member): Promise<string> {
    const source = (member as any)._doc ?? member;
    const payload = { ...source };
    delete payload.memberPassword;
    return this.jwtService.signAsync(payload);
  }

  public async verifyToken(token: string): Promise<Member> {
    return this.jwtService.verifyAsync<Member>(token);
  }

  public async getAuthenticatedMember(token: string): Promise<Member> {
    const tokenMember = await this.verifyToken(token);
    if (!Types.ObjectId.isValid(tokenMember._id)) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    const member = await this.memberModel
      .findById(tokenMember._id)
      .lean()
      .exec();
    if (!member || member.memberStatus !== MemberStatus.ACTIVE) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }

    return member as Member;
  }
}
