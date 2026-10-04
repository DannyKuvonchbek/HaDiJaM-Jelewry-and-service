import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ServiceBooking,
  ServiceBookings,
} from "../../libs/dto/service-booking/service-booking";
import {
  ServiceBookingInput,
  ServiceBookingsInquiry,
} from "../../libs/dto/service-booking/service-booking.input";
import { ServiceBookingUpdate } from "../../libs/dto/service-booking/service-booking.update";
import { Direction, Message } from "../../libs/enums/common.enum";
import { BookingStatus } from "../../libs/enums/service.enum";
import { ServiceStatus } from "../../libs/enums/service.enum";

@Injectable()
export class ServiceBookingService {
  constructor(
    @InjectModel("ServiceBooking")
    private readonly bookingModel: Model<ServiceBooking>,
    @InjectModel("Service") private readonly serviceModel: Model<any>,
  ) {}

  public async createBooking(
    customerId: string,
    input: ServiceBookingInput,
  ): Promise<ServiceBooking> {
    if (!Types.ObjectId.isValid(input.serviceId))
      throw new BadRequestException(Message.BAD_REQUEST);
    const service = await this.serviceModel
      .findOne({ _id: input.serviceId, serviceStatus: ServiceStatus.ACTIVE })
      .lean()
      .exec();
    if (!service) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    if (String((service as any).memberId) === customerId)
      throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
    try {
      return await this.bookingModel.create({
        ...input,
        customerId,
        providerId: (service as any).memberId,
        bookingPrice: (service as any).servicePrice,
        bookingStatus: BookingStatus.REQUESTED,
      });
    } catch {
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async updateBooking(
    memberId: string,
    input: ServiceBookingUpdate,
  ): Promise<ServiceBooking> {
    if (!Types.ObjectId.isValid(input._id))
      throw new BadRequestException(Message.BAD_REQUEST);
    const current = await this.bookingModel.findById(input._id).exec();
    if (!current) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    const update: Record<string, unknown> = {};
    if (String(current.customerId) === memberId) {
      if (input.bookingStatus !== undefined) {
        if (
          input.bookingStatus !== BookingStatus.CANCELLED ||
          ![BookingStatus.REQUESTED, BookingStatus.CONFIRMED].includes(
            current.bookingStatus,
          )
        ) {
          throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
        }
        update.bookingStatus = input.bookingStatus;
      }
      if (input.customerNote !== undefined)
        update.customerNote = input.customerNote;
    } else if (String(current.providerId) === memberId) {
      if (input.bookingStatus !== undefined) {
        const transitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
          [BookingStatus.REQUESTED]: [
            BookingStatus.CONFIRMED,
            BookingStatus.REJECTED,
            BookingStatus.CANCELLED,
          ],
          [BookingStatus.CONFIRMED]: [
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
          ],
        };
        if (
          !transitions[current.bookingStatus]?.includes(input.bookingStatus)
        ) {
          throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
        }
        update.bookingStatus = input.bookingStatus;
      }
      if (input.customerNote !== undefined)
        update.customerNote = input.customerNote;
    } else {
      throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
    }
    const booking = await this.bookingModel
      .findByIdAndUpdate(input._id, update, { new: true })
      .exec();
    if (!booking) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return booking;
  }

  public async getMemberBookings(
    memberId: string,
    input: ServiceBookingsInquiry,
  ): Promise<ServiceBookings> {
    const match: Record<string, unknown> = {
      $or: [
        { customerId: new Types.ObjectId(memberId) },
        { providerId: new Types.ObjectId(memberId) },
      ],
    };
    if (input.bookingStatus) match.bookingStatus = input.bookingStatus;
    const [result] = await this.bookingModel.aggregate([
      { $match: match },
      { $sort: { createdAt: input.direction ?? Direction.DESC } },
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
