import { ObjectId } from "bson";
import { randomUUID } from "crypto";
import { extname } from "path";

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

export const validMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const getSerialForImage = (filename: string): string =>
  `${randomUUID()}${extname(filename).toLowerCase()}`;
