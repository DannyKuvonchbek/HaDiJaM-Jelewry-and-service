import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LikeInput } from "../../libs/dto/like/like.input";
import { Like, MeLiked } from "../../libs/dto/like/like";
import { Products } from "../../libs/dto/product/product";
import { LikeGroup } from "../../libs/enums/like.enum";
import { Message } from "../../libs/enums/common.enum";
import { shapeIntoMongoObjectId } from "../../libs/config";

@Injectable()
export class LikeService {
  constructor(@InjectModel("Like") private readonly likeModel: Model<Like>) {}

  public async toggleLike(input: LikeInput): Promise<number> {
    const filter = {
      memberId: shapeIntoMongoObjectId(input.memberId),
      likeRefId: shapeIntoMongoObjectId(input.likeRefId),
      likeGroup: input.likeGroup,
    };
    const existing = await this.likeModel.findOne(filter).exec();
    if (existing) {
      await this.likeModel.findOneAndDelete(filter).exec();
      return -1;
    }
    try {
      await this.likeModel.create(input);
      return 1;
    } catch {
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async checkLikeExistence(
    input: LikeInput,
  ): Promise<MeLiked[]> {
    const found = await this.likeModel.findOne({
      memberId: shapeIntoMongoObjectId(input.memberId),
      likeRefId: shapeIntoMongoObjectId(input.likeRefId),
      likeGroup: input.likeGroup,
    }).exec();
    return found
      ? [
          {
            memberId: input.memberId,
            likeRefId: input.likeRefId,
            myFavorite: true,
          },
        ]
      : [];
  }

  public async getFavoriteProducts(
    memberId: string,
    page: number,
    limit: number,
  ): Promise<Products> {
    const [result] = await this.likeModel.aggregate([
      {
        $match: {
          memberId: shapeIntoMongoObjectId(memberId),
          likeGroup: LikeGroup.PRODUCT,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "likeRefId",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      { $match: { "productData.productStatus": "ACTIVE" } },
      {
        $facet: {
          list: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $replaceRoot: { newRoot: "$productData" } },
          ],
          metaCounter: [{ $count: "total" }],
        },
      },
    ]);
    return result ?? { list: [], metaCounter: [] };
  }
}
