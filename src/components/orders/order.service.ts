import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order, Orders } from "../../libs/dto/order/order";
import { OrderItem } from "../../libs/dto/order-item/order-item";
import {
  OrderAdminUpdate,
  OrderInput,
  OrderItemUpdate,
  OrdersInquiry,
  OrderUpdate,
} from "../../libs/dto/order/order.input";
import { Direction, Message } from "../../libs/enums/common.enum";
import {
  OrderItemStatus,
  OrderStatus,
  PaymentStatus,
} from "../../libs/enums/order.enum";
import { ProductStatus } from "../../libs/enums/product.enum";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel("Order") private readonly orderModel: Model<Order>,
    @InjectModel("OrderItem") private readonly orderItemModel: Model<OrderItem>,
    @InjectModel("Product") private readonly productModel: Model<any>,
  ) {}

  public async createOrder(
    memberId: string,
    input: OrderInput,
  ): Promise<Order> {
    if (!input.items?.length)
      throw new BadRequestException(Message.BAD_REQUEST);
    const productIds = input.items.map((item) => item.productId);
    if (
      productIds.some((id) => !Types.ObjectId.isValid(id)) ||
      new Set(productIds).size !== productIds.length
    ) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }
    if (
      input.items.some(
        (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
      )
    ) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }

    const products = (await this.productModel
      .find({
        _id: { $in: productIds },
        productStatus: ProductStatus.ACTIVE,
      })
      .lean()
      .exec()) as any[];
    if (products.length !== productIds.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    const productById = new Map(
      products.map((product) => [String(product._id), product]),
    );
    const selectedProducts = input.items.map((item) => ({
      item,
      product: productById.get(item.productId),
    }));
    if (selectedProducts.some(({ product }) => !product))
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    if (
      selectedProducts.some(
        ({ product }) => String(product.memberId) === memberId,
      )
    ) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    const orderPrice = selectedProducts.reduce(
      (total, { item, product }) =>
        total + product.productPrice * item.quantity,
      0,
    );
    if (!Number.isFinite(orderPrice) || orderPrice < 0)
      throw new BadRequestException(Message.BAD_REQUEST);

    let order: any;
    try {
      order = await this.orderModel.create({
        memberId,
        orderStatus: OrderStatus.NEW,
        orderPrice,
        deliveryAddress: input.deliveryAddress,
        deliveryPhone: input.deliveryPhone,
        paymentMethod: input.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
      });
      const items = await this.orderItemModel.insertMany(
        selectedProducts.map(({ item, product }) => ({
          orderId: order._id,
          productId: product._id,
          sellerId: product.memberId,
          productTitle: product.productTitle,
          productType: product.productType,
          productImages: product.productImages ?? [],
          unitPrice: product.productPrice,
          quantity: item.quantity,
          itemPrice: product.productPrice * item.quantity,
          itemStatus: OrderItemStatus.REQUESTED,
        })),
      );
      return { ...order.toObject(), items } as Order;
    } catch {
      if (order?._id) {
        await Promise.all([
          this.orderItemModel.deleteMany({ orderId: order._id }).exec(),
          this.orderModel.findByIdAndDelete(order._id).exec(),
        ]);
      }
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async updateOrder(
    memberId: string,
    input: OrderUpdate,
    isAdmin = false,
  ): Promise<Order> {
    if (!Types.ObjectId.isValid(input._id))
      throw new BadRequestException(Message.BAD_REQUEST);
    const order = await this.orderModel
      .findOne({ _id: input._id, ...(isAdmin ? {} : { memberId }) })
      .exec();
    if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    if (!isAdmin && String(order.memberId) !== memberId)
      throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
    if (!isAdmin && order.orderStatus !== OrderStatus.NEW)
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    const update: Record<string, unknown> = {};
    if (input.deliveryAddress !== undefined)
      update.deliveryAddress = input.deliveryAddress;
    if (input.deliveryPhone !== undefined)
      update.deliveryPhone = input.deliveryPhone;
    if (!Object.keys(update).length)
      throw new BadRequestException(Message.BAD_REQUEST);
    const updated = await this.orderModel
      .findByIdAndUpdate(input._id, update, { new: true })
      .exec();
    if (!updated) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return updated;
  }

  public async updateOrderItem(
    memberId: string,
    input: OrderItemUpdate,
    isAdmin = false,
  ): Promise<OrderItem> {
    if (!Types.ObjectId.isValid(input._id))
      throw new BadRequestException(Message.BAD_REQUEST);
    const item = await this.orderItemModel.findById(input._id).exec();
    if (!item) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    const order = await this.orderModel.findById(item.orderId).exec();
    if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const isCustomer = String(order.memberId) === memberId;
    const isSeller = String(item.sellerId) === memberId;
    if (!isAdmin && !isCustomer && !isSeller)
      throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);

    const sellerTransitions: Partial<
      Record<OrderItemStatus, OrderItemStatus[]>
    > = {
      [OrderItemStatus.REQUESTED]: [
        OrderItemStatus.CONFIRMED,
        OrderItemStatus.REJECTED,
        OrderItemStatus.CANCELLED,
      ],
      [OrderItemStatus.CONFIRMED]: [
        OrderItemStatus.PREPARING,
        OrderItemStatus.CANCELLED,
      ],
      [OrderItemStatus.PREPARING]: [OrderItemStatus.SHIPPED],
      [OrderItemStatus.SHIPPED]: [OrderItemStatus.DELIVERED],
      [OrderItemStatus.RETURN_REQUESTED]: [OrderItemStatus.RETURNED],
    };
    const customerTransitions: Partial<
      Record<OrderItemStatus, OrderItemStatus[]>
    > = {
      [OrderItemStatus.REQUESTED]: [OrderItemStatus.CANCELLED],
      [OrderItemStatus.DELIVERED]: [OrderItemStatus.RETURN_REQUESTED],
    };
    const transitions = isSeller ? sellerTransitions : customerTransitions;
    if (!isAdmin && !transitions[item.itemStatus]?.includes(input.itemStatus)) {
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    }

    item.itemStatus = input.itemStatus;
    await item.save();
    await this.refreshOrderStatus(String(order._id));
    return item;
  }

  public async getMemberOrders(
    memberId: string,
    input: OrdersInquiry,
  ): Promise<Orders> {
    return this.paginate({ memberId: new Types.ObjectId(memberId) }, input);
  }

  public async getSellerOrders(
    sellerId: string,
    input: OrdersInquiry,
  ): Promise<Orders> {
    return this.paginate({}, input, new Types.ObjectId(sellerId));
  }

  public async getAllOrdersByAdmin(input: OrdersInquiry): Promise<Orders> {
    return this.paginate({}, input);
  }

  public async updateOrderByAdmin(input: OrderAdminUpdate): Promise<Order> {
    if (!Types.ObjectId.isValid(input._id))
      throw new BadRequestException(Message.BAD_REQUEST);
    const order = await this.orderModel
      .findByIdAndUpdate(
        input._id,
        { paymentStatus: input.paymentStatus },
        { new: true },
      )
      .exec();
    if (!order) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return order;
  }

  private async refreshOrderStatus(orderId: string): Promise<void> {
    const items = await this.orderItemModel
      .find({ orderId })
      .select("itemStatus")
      .lean()
      .exec();
    if (!items.length) return;
    const statuses = items.map((item) => item.itemStatus);
    const allRejectedOrCancelled = statuses.every((status) =>
      [OrderItemStatus.REJECTED, OrderItemStatus.CANCELLED].includes(status),
    );
    const completionStatuses = [
      OrderItemStatus.DELIVERED,
      OrderItemStatus.RETURN_REQUESTED,
      OrderItemStatus.RETURNED,
      OrderItemStatus.REJECTED,
      OrderItemStatus.CANCELLED,
    ];
    const allComplete = statuses.every((status) =>
      completionStatuses.includes(status),
    );
    const nextStatus = allRejectedOrCancelled
      ? OrderStatus.CANCELLED
      : allComplete
        ? OrderStatus.COMPLETED
        : statuses.every((status) => status === OrderItemStatus.REQUESTED)
          ? OrderStatus.NEW
          : OrderStatus.CONFIRMED;
    await this.orderModel
      .findByIdAndUpdate(orderId, { orderStatus: nextStatus })
      .exec();
  }

  private async paginate(
    match: Record<string, unknown>,
    input: OrdersInquiry,
    sellerId?: Types.ObjectId,
  ): Promise<Orders> {
    const pipeline: any[] = [{ $match: match }];
    pipeline.push({
      $lookup: {
        from: "orderItems",
        localField: "_id",
        foreignField: "orderId",
        as: "items",
      },
    });
    if (sellerId) pipeline.push({ $match: { "items.sellerId": sellerId } });
    pipeline.push(
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberData",
        },
      },
      { $unwind: { path: "$memberData", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: Direction.DESC } },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            ...(sellerId
              ? [
                  {
                    $addFields: {
                      items: {
                        $filter: {
                          input: "$items",
                          as: "item",
                          cond: { $eq: ["$$item.sellerId", sellerId] },
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
          metaCounter: [{ $count: "total" }],
        },
      },
    );
    const [result] = await this.orderModel.aggregate(pipeline);
    return result ?? { list: [], metaCounter: [] };
  }
}
