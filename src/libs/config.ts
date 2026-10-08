import { ObjectId } from "bson";
import { randomUUID } from "crypto";
import { extname } from "path";
import { LikeGroup } from "./enums/like.enum";

export const availableSellerSorts = [
  "createdAt",
  "updatedAt",
  "memberLikes",
  "memberViews",
  "memberRank",
];
export const availableMembersSorts = [
  "createdAt",
  "updatedAt",
  "memberLikes",
  "memberViews",
];
export const availableProductSorts = [
  "createdAt",
  "updatedAt",
  "productPrice",
  "productViews",
  "productLikes",
  "productRank",
];
export const availableBoardArticleSorts = [
  "createdAt",
  "updatedAt",
  "articleLikes",
  "articleViews",
  "articleComments",
];
export const availableServiceSorts = [
  "createdAt",
  "updatedAt",
  "servicePrice",
  "serviceViews",
  "serviceLikes",
  "serviceRank",
];

export const shapeIntoMongoObjectId = (target: any) => {
  return typeof target === "string" ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (
  memberId: string | undefined,
  targetRefId = "$_id",
  likeGroup: LikeGroup = LikeGroup.PRODUCT,
) => ({
  $lookup: {
    from: "likes",
    let: {
      localLikeRefId: targetRefId,
      localMemberId: memberId ? shapeIntoMongoObjectId(memberId) : null,
      localLikeGroup: likeGroup,
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$likeRefId", "$$localLikeRefId"] },
              { $eq: ["$memberId", "$$localMemberId"] },
              { $eq: ["$likeGroup", "$$localLikeGroup"] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          memberId: 1,
          likeRefId: 1,
          myFavorite: { $literal: true },
        },
      },
    ],
    as: "meLiked",
  },
});

export const lookupAuthMemberFollowed = (input: {
  followerId?: string;
  followingId: string;
}) => ({
  $lookup: {
    from: "follows",
    let: {
      localFollowerId: input.followerId
        ? shapeIntoMongoObjectId(input.followerId)
        : null,
      localFollowingId: input.followingId,
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ["$followerId", "$$localFollowerId"] },
              { $eq: ["$followingId", "$$localFollowingId"] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          followerId: 1,
          followingId: 1,
          myFollowing: { $literal: true },
        },
      },
    ],
    as: "meFollowed",
  },
});

export const lookupFollowingData = {
  $lookup: {
    from: "members",
    localField: "followingId",
    foreignField: "_id",
    as: "followingData",
  },
};

export const lookupFollowerData = {
  $lookup: {
    from: "members",
    localField: "followerId",
    foreignField: "_id",
    as: "followerData",
  },
};

export const validMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export const getSerialForImage = (filename: string): string =>
  `${randomUUID()}${extname(filename).toLowerCase()}`;
