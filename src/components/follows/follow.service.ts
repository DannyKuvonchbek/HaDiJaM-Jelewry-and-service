import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Follower,
  Followers,
  Following,
  Followings,
} from "../../libs/dto/follow/follow";
import { FollowInquiry } from "../../libs/dto/follow/follow.input";
import {
  lookupAuthMemberFollowed,
  lookupAuthMemberLiked,
  lookupFollowerData,
  lookupFollowingData,
  shapeIntoMongoObjectId,
} from "../../libs/config";
import { Direction, Message } from "../../libs/enums/common.enum";
import { LikeGroup } from "../../libs/enums/like.enum";
import { MemberService } from "../members/member.service";

@Injectable()
export class FollowService {
  constructor(
    @InjectModel("Follow")
    private readonly followModel: Model<Following | Follower>,
    private readonly memberService: MemberService,
  ) {}

  public async subscribe(
    followerId: string,
    followingId: string,
  ): Promise<Follower> {
    if (!Types.ObjectId.isValid(followerId) || !Types.ObjectId.isValid(followingId)) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }
    if (followerId === followingId) {
      throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);
    }

    await this.memberService.getMember("", followingId);
    const result = await this.registerSubscription(followerId, followingId);

    await this.memberService.memberStatsEditor(
      followerId,
      "memberFollowings",
      1,
    );
    await this.memberService.memberStatsEditor(
      followingId,
      "memberFollowers",
      1,
    );

    return result;
  }

  private async registerSubscription(
    followerId: string,
    followingId: string,
  ): Promise<Follower> {
    try {
      return await this.followModel.create({
        followingId: shapeIntoMongoObjectId(followingId),
        followerId: shapeIntoMongoObjectId(followerId),
      });
    } catch (error) {
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async unsubscribe(
    followerId: string,
    followingId: string,
  ): Promise<Follower> {
    if (!Types.ObjectId.isValid(followerId) || !Types.ObjectId.isValid(followingId)) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }
    await this.memberService.getMember("", followingId);

    const result = await this.followModel
      .findOneAndDelete({
        followingId: shapeIntoMongoObjectId(followingId),
        followerId: shapeIntoMongoObjectId(followerId),
      })
      .exec();

    if (!result) {
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    }

    await this.memberService.memberStatsEditor(
      followerId,
      "memberFollowings",
      -1,
    );
    await this.memberService.memberStatsEditor(
      followingId,
      "memberFollowers",
      -1,
    );

    return result;
  }

  public async getMemberFollowings(
    memberId: string | undefined,
    input: FollowInquiry,
  ): Promise<Followings> {
    const followerId = input.search?.followerId;
    if (!followerId || !Types.ObjectId.isValid(followerId)) {
      throw new InternalServerErrorException(Message.BAD_REQUEST);
    }

    return this.list(
      memberId,
      input,
      { followerId: shapeIntoMongoObjectId(followerId) },
      "followingId",
      lookupFollowingData,
    ) as Promise<Followings>;
  }

  public async getMemberFollowers(
    memberId: string | undefined,
    input: FollowInquiry,
  ): Promise<Followers> {
    const followingId = input.search?.followingId;
    if (!followingId || !Types.ObjectId.isValid(followingId)) {
      throw new InternalServerErrorException(Message.BAD_REQUEST);
    }

    return this.list(
      memberId,
      input,
      { followingId: shapeIntoMongoObjectId(followingId) },
      "followerId",
      lookupFollowerData,
    ) as Promise<Followers>;
  }

  private async list(
    memberId: string | undefined,
    input: FollowInquiry,
    match: Record<string, unknown>,
    targetField: "followingId" | "followerId",
    memberLookup: {
      $lookup: {
        from: string;
        localField: string;
        foreignField: string;
        as: string;
      };
    },
  ): Promise<Followings | Followers> {
    const dataField = targetField === "followingId" ? "followingData" : "followerData";
    const [result] = await this.followModel.aggregate([
      { $match: match },
      { $sort: { createdAt: Direction.DESC } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupAuthMemberLiked(memberId, `$${targetField}`, LikeGroup.MEMBER),
            lookupAuthMemberFollowed({
              followerId: memberId,
              followingId: `$${targetField}`,
            }),
            memberLookup,
            { $unwind: `$${dataField}` },
          ],
          metaCounter: [{ $count: "total" }],
        },
      },
    ]);

    return result ?? { list: [], metaCounter: [] };
  }
}
