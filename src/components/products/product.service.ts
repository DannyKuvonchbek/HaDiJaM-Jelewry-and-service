import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product, Products } from "../../libs/dto/product/product";
import {
  SellerProductsInquiry,
  OrdinaryInquiry,
  ProductInput,
  ProductUpdate,
  ProductsInquiry,
} from "../../libs/dto/product/product.input";
import { Direction, Message } from "../../libs/enums/common.enum";
import { ProductStatus } from "../../libs/enums/product.enum";
import { MemberService } from "../members/member.service";
import { LikeService } from "../likes/like.service";
import { ViewService } from "../views/view.service";
import { LikeGroup } from "../../libs/enums/like.enum";
import { ViewGroup } from "../../libs/enums/view.enum";
import { LikeInput } from "../../libs/dto/like/like.input";
import { ViewInput } from "../../libs/dto/view/view.input";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel("Product") private readonly productModel: Model<Product>,
    private readonly memberService: MemberService,
    private readonly likeService: LikeService,
    private readonly viewService: ViewService,
  ) {}

  public async createProduct(
    memberId: string,
    input: ProductInput,
  ): Promise<Product> {
    try {
      const product = await this.productModel.create({ ...input, memberId });
      await this.memberService.memberStatsEditor(memberId, "memberProducts", 1);
      return product;
    } catch {
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getProduct(
    productId: string,
    memberId?: string,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(productId))
      throw new BadRequestException(Message.BAD_REQUEST);
    const product = await this.productModel
      .findOne({ _id: productId, productStatus: ProductStatus.ACTIVE })
      .lean()
      .exec();
    if (!product) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    if (memberId) {
      const viewInput: ViewInput = {
        memberId,
        viewRefId: productId,
        viewGroup: ViewGroup.PRODUCT,
      };
      const newView = await this.viewService.recordView(viewInput);
      if (newView)
        await this.productModel
          .findByIdAndUpdate(productId, { $inc: { productViews: 1 } })
          .exec();
      const likeInput: LikeInput = {
        memberId,
        likeRefId: productId,
        likeGroup: LikeGroup.PRODUCT,
      };
      (product as Product).meLiked =
        await this.likeService.checkLikeExistence(likeInput);
    }
    return product as Product;
  }

  public async likeTargetProduct(
    memberId: string,
    productId: string,
  ): Promise<Product> {
    const product = await this.productModel
      .findOne({ _id: productId, productStatus: ProductStatus.ACTIVE })
      .exec();
    if (!product) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    const input: LikeInput = {
      memberId,
      likeRefId: productId,
      likeGroup: LikeGroup.PRODUCT,
    };
    const modifier = await this.likeService.toggleLike(input);
    const updated = await this.productModel
      .findByIdAndUpdate(
        productId,
        { $inc: { productLikes: modifier } },
        { new: true },
      )
      .exec();
    if (!updated)
      throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
    return updated;
  }

  public async getFavorites(
    memberId: string,
    input: OrdinaryInquiry,
  ): Promise<Products> {
    return this.likeService.getFavoriteProducts(
      memberId,
      input.page,
      input.limit,
    );
  }

  public async getVisited(
    memberId: string,
    input: OrdinaryInquiry,
  ): Promise<Products> {
    return this.viewService.getVisitedProducts(
      memberId,
      input.page,
      input.limit,
    );
  }

  public async updateProduct(
    memberId: string,
    input: ProductUpdate,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(input._id))
      throw new BadRequestException(Message.BAD_REQUEST);
    const update: Record<string, unknown> = { ...input };
    delete update._id;
    if (input.productStatus === ProductStatus.SOLD) update.soldAt = new Date();
    if (input.productStatus === ProductStatus.DELETE)
      update.deletedAt = new Date();
    const product = await this.productModel
      .findOneAndUpdate(
        { _id: input._id, memberId, productStatus: ProductStatus.ACTIVE },
        update,
        { new: true },
      )
      .exec();
    if (!product) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    if (
      input.productStatus === ProductStatus.SOLD ||
      input.productStatus === ProductStatus.DELETE
    ) {
      await this.memberService.memberStatsEditor(
        memberId,
        "memberProducts",
        -1,
      );
    }
    return product;
  }

  public async getProducts(input: ProductsInquiry): Promise<Products> {
    const { search } = input;
    const match: Record<string, any> = { productStatus: ProductStatus.ACTIVE };
    if (search.memberId && Types.ObjectId.isValid(search.memberId))
      match.memberId = new Types.ObjectId(search.memberId);
    if (search.productType) match.productType = search.productType;
    if (search.text?.trim())
      match.productTitle = {
        $regex: search.text.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    if (search.minPrice !== undefined || search.maxPrice !== undefined) {
      match.productPrice = {};
      if (search.minPrice !== undefined)
        match.productPrice.$gte = search.minPrice;
      if (search.maxPrice !== undefined)
        match.productPrice.$lte = search.maxPrice;
    }
    const sort = {
      [input.sort ?? "createdAt"]: input.direction ?? Direction.DESC,
    };
    const [result] = await this.productModel.aggregate([
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

  public async getSellerProducts(
    memberId: string,
    input: SellerProductsInquiry,
  ): Promise<Products> {
    if (input.search.productStatus === ProductStatus.DELETE)
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    const productStatus = input.search.productStatus ?? {
      $ne: ProductStatus.DELETE,
    };
    const [result] = await this.productModel.aggregate([
      { $match: { memberId: new Types.ObjectId(memberId), productStatus } },
      {
        $sort: {
          [input.sort ?? "createdAt"]: input.direction ?? Direction.DESC,
        },
      },
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

  public async getAllProductsByAdmin(
    input: ProductsInquiry,
  ): Promise<Products> {
    const match: Record<string, unknown> = {};
    if (input.search.productStatus)
      match.productStatus = input.search.productStatus;
    if (input.search.productType) match.productType = input.search.productType;
    const [result] = await this.productModel.aggregate([
      { $match: match },
      {
        $sort: {
          [input.sort ?? "createdAt"]: input.direction ?? Direction.DESC,
        },
      },
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

  public async updateProductByAdmin(input: ProductUpdate): Promise<Product> {
    const update: Record<string, unknown> = { ...input };
    delete update._id;
    if (input.productStatus === ProductStatus.SOLD) update.soldAt = new Date();
    if (input.productStatus === ProductStatus.DELETE)
      update.deletedAt = new Date();
    const filter =
      input.productStatus === ProductStatus.SOLD ||
      input.productStatus === ProductStatus.DELETE
        ? { _id: input._id, productStatus: ProductStatus.ACTIVE }
        : { _id: input._id };
    const product = await this.productModel
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
    if (!product) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    if (
      input.productStatus === ProductStatus.SOLD ||
      input.productStatus === ProductStatus.DELETE
    ) {
      await this.memberService.memberStatsEditor(
        String(product.memberId),
        "memberProducts",
        -1,
      );
    }
    return product;
  }

  public async removeProductByAdmin(productId: string): Promise<Product> {
    const product = await this.productModel
      .findOneAndDelete({ _id: productId, productStatus: ProductStatus.DELETE })
      .exec();
    if (!product) throw new InternalServerErrorException(Message.REMOVE_FAILED);
    return product;
  }
}
