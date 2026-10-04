import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ServiceDeliveries,
  ServiceDelivery,
} from "../../libs/dto/service-delivery/service-delivery";
import {
  ServiceDeliveriesInquiry,
  ServiceDeliveryInput,
} from "../../libs/dto/service-delivery/service-delivery.input";
import { ServiceDeliveryUpdate } from "../../libs/dto/service-delivery/service-delivery.update";
import { Direction, Message } from "../../libs/enums/common.enum";
import { DeliveryStatus } from "../../libs/enums/service.enum";

@Injectable()
export class ServiceDeliveryService {
  constructor(
    @InjectModel("ServiceDelivery")
    private readonly deliveryModel: Model<ServiceDelivery>,
    @InjectModel("Service") private readonly serviceModel: Model<any>,
    @InjectModel("ServiceBooking") private readonly bookingModel: Model<any>,
    @InjectModel("ServiceRequest") private readonly requestModel: Model<any>,
  ) {}

  public async createDelivery(
    memberId: string,
    input: ServiceDeliveryInput,
  ): Promise<ServiceDelivery> {
    if (!input.serviceId && !input.bookingId && !input.requestId)
      throw new BadRequestException(Message.BAD_REQUEST);
    if (input.serviceId) {
      if (!Types.ObjectId.isValid(input.serviceId))
        throw new BadRequestException(Message.BAD_REQUEST);
      const service = await this.serviceModel.exists({ _id: input.serviceId });
      if (!service)
        throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    }
    if (input.bookingId) {
      if (!Types.ObjectId.isValid(input.bookingId))
        throw new BadRequestException(Message.BAD_REQUEST);
      const booking = await this.bookingModel
        .findOne({
          _id: input.bookingId,
          $or: [{ customerId: memberId }, { providerId: memberId }],
        })
        .lean()
        .exec();
      if (!booking)
        throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
      if (
        input.serviceId &&
        String((booking as any).serviceId) !== input.serviceId
      )
        throw new BadRequestException(Message.BAD_REQUEST);
    }
    if (input.requestId) {
      if (!Types.ObjectId.isValid(input.requestId))
        throw new BadRequestException(Message.BAD_REQUEST);
      const request = await this.requestModel
        .findOne({
          _id: input.requestId,
          $or: [{ customerId: memberId }, { providerId: memberId }],
        })
        .lean()
        .exec();
      if (!request)
        throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
      if (
        input.serviceId &&
        String((request as any).serviceId) !== input.serviceId
      )
        throw new BadRequestException(Message.BAD_REQUEST);
      if (
        input.bookingId &&
        String((request as any).bookingId) !== input.bookingId
      )
        throw new BadRequestException(Message.BAD_REQUEST);
    }
    try {
      return await this.deliveryModel.create({ ...input, memberId });
    } catch {
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async updateDelivery(
    memberId: string,
    input: ServiceDeliveryUpdate,
  ): Promise<ServiceDelivery> {
    const update: Record<string, unknown> = { ...input };
    delete update._id;
    if (input.deliveryStatus !== undefined) {
      const current = await this.deliveryModel
        .findOne({ _id: input._id, memberId })
        .exec();
      if (!current)
        throw new InternalServerErrorException(Message.NO_DATA_FOUND);
      const transitions: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
        [DeliveryStatus.NEW]: [
          DeliveryStatus.PREPARING,
          DeliveryStatus.CANCELLED,
        ],
        [DeliveryStatus.PREPARING]: [
          DeliveryStatus.SENT,
          DeliveryStatus.CANCELLED,
        ],
        [DeliveryStatus.SENT]: [
          DeliveryStatus.RECEIVED,
          DeliveryStatus.RETURNED,
          DeliveryStatus.CANCELLED,
        ],
        [DeliveryStatus.RECEIVED]: [DeliveryStatus.RETURNED],
      };
      if (
        !transitions[current.deliveryStatus]?.includes(input.deliveryStatus)
      ) {
        throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
      }
      if (input.deliveryStatus === DeliveryStatus.SENT)
        update.sentAt = new Date();
      if (input.deliveryStatus === DeliveryStatus.RECEIVED)
        update.receivedAt = new Date();
      if (input.deliveryStatus === DeliveryStatus.RETURNED)
        update.returnedAt = new Date();
    }
    const delivery = await this.deliveryModel
      .findOneAndUpdate({ _id: input._id, memberId }, update, { new: true })
      .exec();
    if (!delivery)
      throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return delivery;
  }

  public async getMyDeliveries(
    memberId: string,
    input: ServiceDeliveriesInquiry,
  ): Promise<ServiceDeliveries> {
    const [result] = await this.deliveryModel.aggregate([
      { $match: { memberId: new Types.ObjectId(memberId) } },
      { $sort: { createdAt: Direction.DESC } },
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
}
