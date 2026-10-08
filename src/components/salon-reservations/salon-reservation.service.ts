import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { SalonReservation } from '../../libs/dto/salon-reservation/salon-reservation';
import { SalonReservationInput } from '../../libs/dto/salon-reservation/salon-reservation.input';

@Injectable()
export class SalonReservationService {
  constructor(@InjectModel('SalonReservation') private readonly reservationModel: Model<SalonReservation>) {}

  async listForCustomer(customerId: string): Promise<SalonReservation[]> {
    return this.reservationModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ bookingDate: -1, bookingTime: -1 })
      .limit(50)
      .exec();
  }

  async listBookedTimes(suiteId: string, from: Date, to: Date): Promise<Date[]> {
    return this.reservationModel
      .find({
        suiteId,
        bookingTime: { $gte: from, $lt: to },
        reservationStatus: { $in: ['REQUESTED', 'CONFIRMED'] },
      })
      .distinct('bookingTime')
      .exec();
  }

  async create(customerId: string, input: SalonReservationInput): Promise<SalonReservation> {
    const slotTaken = await this.reservationModel.exists({
      suiteId: input.suiteId,
      bookingTime: input.bookingTime,
      reservationStatus: { $in: ['REQUESTED', 'CONFIRMED'] },
    });
    if (slotTaken) throw new ConflictException('This salon suite time slot is no longer available.');
    const reference = `HDJ-SAL-${randomBytes(3).toString('hex').toUpperCase()}`;
    return this.reservationModel.create({
      ...input,
      customerId: new Types.ObjectId(customerId),
      reservationReference: reference,
      reservationStatus: 'REQUESTED',
    });
  }

  async deletePastReservation(customerId: string, reservationId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new BadRequestException('Invalid salon reservation id.');
    }
    const result = await this.reservationModel.deleteOne({
      _id: new Types.ObjectId(reservationId),
      customerId: new Types.ObjectId(customerId),
      $or: [
        { bookingTime: { $lt: new Date() } },
        { reservationStatus: 'CANCELLED' },
      ],
    }).exec();
    if (result.deletedCount !== 1) {
      throw new NotFoundException('Past salon reservation not found.');
    }
    return true;
  }

  async rescheduleReservation(
    customerId: string,
    reservationId: string,
    bookingDate: Date,
    bookingTime: Date,
  ): Promise<SalonReservation> {
    if (!Types.ObjectId.isValid(reservationId) || Number.isNaN(bookingTime.getTime())) {
      throw new BadRequestException('Invalid salon reservation or booking time.');
    }
    const now = new Date();
    const current = await this.reservationModel.findOne({
      _id: new Types.ObjectId(reservationId),
      customerId: new Types.ObjectId(customerId),
      bookingTime: { $gt: now },
      reservationStatus: { $in: ['REQUESTED', 'CONFIRMED'] },
    }).exec();
    if (!current) throw new NotFoundException('Upcoming salon reservation not found.');
    if (bookingTime <= now) throw new BadRequestException('Choose a future booking time.');

    const slotTaken = await this.reservationModel.exists({
      _id: { $ne: current._id },
      suiteId: current.suiteId,
      bookingTime,
      reservationStatus: { $in: ['REQUESTED', 'CONFIRMED'] },
    });
    if (slotTaken) throw new ConflictException('This salon suite time slot is no longer available.');

    const updated = await this.reservationModel.findOneAndUpdate(
      {
        _id: current._id,
        customerId: new Types.ObjectId(customerId),
        bookingTime: { $gt: new Date() },
        reservationStatus: { $in: ['REQUESTED', 'CONFIRMED'] },
      },
      { $set: { bookingDate, bookingTime } },
      { new: true },
    ).exec();
    if (!updated) throw new NotFoundException('Upcoming salon reservation not found.');
    return updated;
  }

  async cancelReservation(customerId: string, reservationId: string): Promise<SalonReservation> {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new BadRequestException('Invalid salon reservation id.');
    }
    const cancelled = await this.reservationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(reservationId),
        customerId: new Types.ObjectId(customerId),
        bookingTime: { $gt: new Date() },
        reservationStatus: { $in: ['REQUESTED', 'CONFIRMED'] },
      },
      { $set: { reservationStatus: 'CANCELLED' } },
      { new: true },
    ).exec();
    if (!cancelled) throw new NotFoundException('Upcoming salon reservation not found.');
    return cancelled;
  }
}
