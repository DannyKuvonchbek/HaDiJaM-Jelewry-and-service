import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Member, Members } from "../../libs/dto/member/member";
import {
  SellersInquiry,
  LoginInput,
  MemberInput,
  MembersInquiry,
} from "../../libs/dto/member/member.input";
import { MemberStatus, MemberType } from "../../libs/enums/member.enum";
import { Direction, Message } from "../../libs/enums/common.enum";
import { AuthService } from "../auth/auth.service";
import { MemberUpdate } from "../../libs/dto/member/member.update";
import { T } from "../../libs/types/common";
import { shapeIntoMongoObjectId } from "../../libs/config";
import { LikeService } from "../likes/like.service";
import { LikeGroup } from "../../libs/enums/like.enum";
import { LikeInput } from "../../libs/dto/like/like.input";
import { Follow, Following } from "../../libs/dto/follow/follow";
import { ViewService } from "../views/view.service";
import { ViewGroup } from "../../libs/enums/view.enum";

@Injectable()
export class MemberService {
  constructor(
    @InjectModel("Member") private readonly memberModel: Model<Member>,
    @InjectModel("Follow")
    private readonly followModel: Model<Follow | Following>,
    private readonly authService: AuthService,
    private readonly likeService: LikeService,
    private readonly viewService: ViewService,
  ) {}

  public async signup(input: MemberInput): Promise<Member> {
    if (input.memberType === MemberType.ADMIN) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }
    // Signup can record seller interest, but privileges are granted only after review.
    input.sellerIntent = input.sellerIntent === true || input.memberType === MemberType.SELLER;
    input.memberType = MemberType.USER;
    input.memberPassword = await this.authService.hashPassword(
      input.memberPassword,
    );
    let member: Member;
    try {
      member = await this.memberModel.create(input);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
      }
      throw error;
    }

    return member;
  }

  public async login(input: LoginInput): Promise<Member> {
    const member = await this.memberModel
      .findOne({ memberNick: input.memberNick })
      .select("+memberPassword")
      .exec();

    if (!member || member.memberStatus === MemberStatus.DELETE) {
      throw new UnauthorizedException("Invalid username or password.");
    }
    if (member.memberStatus === MemberStatus.BLOCK) {
      throw new UnauthorizedException("Invalid username or password.");
    }
    if (
      !(await this.authService.comparePasswords(
        input.memberPassword,
        member.memberPassword,
      ))
    ) {
      throw new UnauthorizedException("Invalid username or password.");
    }


    return member;
  }

  public async updateMember(
    memberId: string,
    input: MemberUpdate,
  ): Promise<Member> {
    const update = { ...input } as Partial<Member>;
    delete (update as any)._id;
    delete (update as any).memberType;
    delete (update as any).memberStatus;
    if (update.memberPassword)
      update.memberPassword = await this.authService.hashPassword(
        update.memberPassword,
      );

    let member: Member | null;
    try {
      member = await this.memberModel
        .findOneAndUpdate(
          {
            _id: shapeIntoMongoObjectId(memberId),
            memberStatus: MemberStatus.ACTIVE,
          },
          update,
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
      }
      throw error;
    }
    if (!member) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (update.memberPassword) await this.authService.revokeMember(memberId);
    return member;
  }

  public async getMember(
    memberId: string,
    targetId: string,
  ): Promise<Member> {
    const member = await this.memberModel
      .findOne({
        _id: shapeIntoMongoObjectId(targetId),
        memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
      })
      .lean()
      .exec();
    if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    if (memberId && memberId !== targetId) {
      await this.viewService.recordView({
        memberId,
        viewRefId: targetId,
        viewGroup: ViewGroup.MEMBER,
      });
      const [meLiked, meFollowed] = await Promise.all([
        this.likeService.checkLikeExistence({
          memberId,
          likeRefId: targetId,
          likeGroup: LikeGroup.MEMBER,
        }),
        this.followModel.exists({
          followerId: shapeIntoMongoObjectId(memberId),
          followingId: shapeIntoMongoObjectId(targetId),
        }),
      ]);
      (member as Member).meLiked = meLiked;
      (member as Member).meFollowed = meFollowed
        ? [
            {
              followerId: memberId,
              followingId: targetId,
              myFollowing: true,
            },
          ]
        : [];
    }
    return member as Member;
  }

  public async likeTargetMember(
    memberId: string,
    targetMemberId: string,
  ): Promise<Member> {
    const member = await this.memberModel
      .findOne({
        _id: shapeIntoMongoObjectId(targetMemberId),
        memberStatus: MemberStatus.ACTIVE,
      })
      .exec();
    if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    const input: LikeInput = {
      memberId,
      likeRefId: targetMemberId,
      likeGroup: LikeGroup.MEMBER,
    };
    const modifier = await this.likeService.toggleLike(input);
    const updated = await this.memberModel
      .findByIdAndUpdate(
        targetMemberId,
        { $inc: { memberLikes: modifier } },
        { new: true },
      )
      .exec();
    if (!updated)
      throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
    return updated;
  }

  public async getSellers(
    memberId: string | undefined,
    input: SellersInquiry,
  ): Promise<Members> {
    const match: T = {
      memberType: MemberType.SELLER,
      memberStatus: MemberStatus.ACTIVE,
    };
    const sort: T = {
      [input.sort ?? "createdAt"]: input.direction ?? Direction.DESC,
    };
    const text = input.search?.text?.trim();
    if (text)
      match.memberNick = {
        $regex: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      };

    const [result] = await this.memberModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: "total" }],
        },
      },
    ]);
    const response: Members = result ?? { list: [], metaCounter: [] };
    if (memberId && response.list.length) {
      response.list = await Promise.all(
        response.list.map(async (seller) => {
          seller.meLiked = await this.likeService.checkLikeExistence({
            memberId,
            likeRefId: seller._id,
            likeGroup: LikeGroup.MEMBER,
          });
          return seller;
        }),
      );
    }
    return response;
  }

  public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
    const { memberStatus, memberType, text } = input.search;
    const match: T = {};
    if (memberStatus) match.memberStatus = memberStatus;
    if (memberType) match.memberType = memberType;
    if (text?.trim())
      match.memberNick = {
        $regex: new RegExp(
          text.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        ),
      };
    const sort: T = {
      [input.sort ?? "createdAt"]: input.direction ?? Direction.DESC,
    };

    const [result] = await this.memberModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
          ],
          metaCounter: [{ $count: "total" }],
        },
      },
    ]);
    return result ?? { list: [], metaCounter: [] };
  }

  public async updateMembersByAdmin(input: MemberUpdate): Promise<Member> {
    if (input.memberType !== undefined) {
      throw new BadRequestException('Roles are managed through seller approval and the local admin provisioning command.');
    }
    const existing: any = await this.memberModel.findById(shapeIntoMongoObjectId(input._id)).lean();
    if (existing?.memberType === MemberType.ADMIN && input.memberStatus !== undefined && input.memberStatus !== MemberStatus.ACTIVE) {
      // Public management never disables an administrator. This stronger invariant
      // also prevents concurrent requests from removing the last active admin.
      throw new BadRequestException('Administrator accounts are protected from blocking or deletion.');
    }
    const update: Record<string, unknown> = { ...input };
    delete update._id;
    if (update.memberPassword)
      update.memberPassword = await this.authService.hashPassword(
        String(update.memberPassword),
      );
    if (input.memberStatus === MemberStatus.DELETE)
      update.deletedAt = new Date();
    if (input.memberStatus === MemberStatus.ACTIVE) update.deletedAt = null;

    const member = await this.memberModel
      .findByIdAndUpdate(shapeIntoMongoObjectId(input._id), update, {
        new: true,
      })
      .exec();
    if (!member) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    if (update.memberPassword || (input.memberStatus !== undefined && input.memberStatus !== MemberStatus.ACTIVE)) await this.authService.revokeMember(String(input._id));
    return member;
  }

  public async memberStatsEditor(
    memberId: string,
    field: string,
    modifier: number,
  ): Promise<Member> {
    return this.memberModel
      .findByIdAndUpdate(
        memberId,
        { $inc: { [field]: modifier } },
        { new: true },
      )
      .exec();
  }
}
