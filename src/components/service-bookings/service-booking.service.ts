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
  ServiceBookingAvailabilityInput,
  ServiceBookingsInquiry,
} from "../../libs/dto/service-booking/service-booking.input";
import { ServiceBookingUpdate } from "../../libs/dto/service-booking/service-booking.update";
import { Direction, Message } from "../../libs/enums/common.enum";
import { BookingStatus } from "../../libs/enums/service.enum";
import { ServiceStatus } from "../../libs/enums/service.enum";

function getBookingServiceKind(service: {
  serviceCategory?: string;
  serviceTitle?: string;
}): "REPAIR" | "POLISHING" | "OTHER" {
  const identity =
    `${service.serviceCategory ?? ""} ${service.serviceTitle ?? ""}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");
  if (/\brepair\b|\brestor(?:ation|ing|e)?\b|micro laser/.test(identity))
    return "REPAIR";
  if (
    /ultrasonic|\bpolish(?:ing)?\b|\bclean(?:ing|se|sing)?\b|rhodium/.test(
      identity,
    )
  )
    return "POLISHING";
  return "OTHER";
}

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
    const selectedTechnician =
      input.selectedTechnician?.trim() || "Atelier Concierge";
    const selectedItems = [...new Set(input.selectedItems ?? [])];
    const serviceKind = getBookingServiceKind(service as any);
    const isPolishing = serviceKind === "POLISHING";
    const isRepair = serviceKind === "REPAIR";
    if (!selectedTechnician || (isRepair && !input.itemDescription?.trim()))
      throw new BadRequestException(Message.BAD_REQUEST);
    const allowedTechnicians = isPolishing
      ? [
          "Express Vault Station",
          "Senior Technician Lee Dong-Hae",
          "Master Finisher Han So-Hee",
        ]
      : ["Master Kang Min-Seok", "Master Sofia Elena", "Master Park Jin-Woo"];
    if (
      (isRepair || isPolishing) &&
      !allowedTechnicians.includes(selectedTechnician)
    )
      throw new BadRequestException(Message.BAD_REQUEST);
    if (isPolishing && selectedItems.length === 0)
      throw new BadRequestException(Message.BAD_REQUEST);
    if (
      isPolishing &&
      selectedItems.some(
        (item) =>
          ![
            "Ring",
            "Necklace",
            "Bracelet",
            "Earrings",
            "Brooch",
            "Watch Bezel",
          ].includes(item),
      )
    )
      throw new BadRequestException(Message.BAD_REQUEST);
    if (
      (isRepair || isPolishing) &&
      (!input.customerName?.trim() ||
        !input.customerPhone?.trim() ||
        !input.customerAddress?.trim())
    )
      throw new BadRequestException(Message.BAD_REQUEST);
    const date = new Date(input.bookingDate);
    const time = new Date(input.bookingTime);
    if (
      Number.isNaN(date.getTime()) ||
      Number.isNaN(time.getTime()) ||
      time.getTime() <= Date.now()
    )
      throw new BadRequestException(Message.BAD_REQUEST);
    const dateLabel = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    const appointmentDateLabel = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(time);
    if ((isRepair || isPolishing) && appointmentDateLabel !== dateLabel)
      throw new BadRequestException(Message.BAD_REQUEST);
    const timeLabel = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(time);
    const allowedTimes = isPolishing
      ? ["10:30", "11:30", "13:00", "14:30", "16:00", "17:30"]
      : ["10:00", "11:30", "14:00", "15:30", "17:00", "18:30"];
    if ((isRepair || isPolishing) && !allowedTimes.includes(timeLabel))
      throw new BadRequestException(Message.BAD_REQUEST);
    const servicePrice =
      Number((service as any).servicePrice) > 0
        ? Number((service as any).servicePrice)
        : isPolishing
          ? 35
          : 45;
    const bookingPrice = isRepair
      ? 45
      : servicePrice * (isPolishing ? selectedItems.length : 1);
    const slotKey = `${input.serviceId}:${dateLabel}:${timeLabel}:${selectedTechnician.toLowerCase()}`;
    const bookingReference = `HDJ-SVC-${new Types.ObjectId().toHexString().slice(-10).toUpperCase()}`;
    try {
      return await this.bookingModel.create({
        ...input,
        serviceTitle: (service as any).serviceTitle,
        bookingDate: date,
        bookingTime: time,
        customerName: input.customerName?.trim() || "HaDiJaM Client",
        selectedTechnician,
        selectedItems,
        bookingPrice,
        bookingReference,
        paymentStatus: "PENDING",
        slotKey,
        customerId,
        providerId: (service as any).memberId,
        bookingStatus: BookingStatus.REQUESTED,
      });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000)
        throw new BadRequestException(
          "This appointment slot was just reserved. Please choose another time.",
        );
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getUnavailableSlots(
    input: ServiceBookingAvailabilityInput,
  ): Promise<string[]> {
    if (
      !Types.ObjectId.isValid(input.serviceId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.date)
    )
      throw new BadRequestException(Message.BAD_REQUEST);
    const dayStart = new Date(`${input.date}T00:00:00+09:00`);
    const dayEnd = new Date(`${input.date}T23:59:59.999+09:00`);
    const rows = await this.bookingModel
      .find({
        serviceId: new Types.ObjectId(input.serviceId),
        bookingTime: { $gte: dayStart, $lte: dayEnd },
        selectedTechnician: input.technician,
        bookingStatus: {
          $nin: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
        },
      })
      .select("bookingTime")
      .lean()
      .exec();
    return rows.map((row) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(row.bookingTime),
    );
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
      .findByIdAndUpdate(
        input._id,
        {
          ...update,
          ...([BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(
            update.bookingStatus as BookingStatus,
          )
            ? { $unset: { slotKey: 1 } }
            : {}),
        },
        { new: true },
      )
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
