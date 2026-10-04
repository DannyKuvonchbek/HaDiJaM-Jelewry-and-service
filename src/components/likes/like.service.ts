import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { LikeInput } from "../../libs/dto/like/like.input";
import { Like } from "../../libs/dto/like/like";
import { LikeGroup } from "../../libs/enums/like.enum";
import { Message } from "../../libs/enums/common.enum";

@Injectable()
export class LikeService {
  constructor(@InjectModel("Like") private readonly likeModel: Model<Like>) {}

  public async toggleLike(input: LikeInput): Promise<number> {
    const filter = {
      memberId: input.memberId,
      likeRefId: input.likeRefId,
      likeGroup: input.likeGroup,
    };
    const existing = await this.likeModel.findOne(filter).exec();
    if (existing) {
      await this.likeModel.findByIdAndDelete(existing._id).exec();
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
  ): Promise<{ memberId: string; likeRefId: string; myFavorite: boolean }[]> {
    const found = await this.likeModel.exists({
      memberId: input.memberId,
      likeRefId: input.likeRefId,
      likeGroup: input.likeGroup,
    });
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
  ): Promise<any> {
    const [data] = await this.likeModel.aggregate([
      {
        $match: {
          memberId: new Types.ObjectId(memberId),
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
    return data ?? { list: [], metaCounter: [] };
  }
}
