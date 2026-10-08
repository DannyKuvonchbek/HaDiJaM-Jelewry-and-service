import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SalonReservation } from '../../libs/dto/salon-reservation/salon-reservation';
import { SalonReservationInput } from '../../libs/dto/salon-reservation/salon-reservation.input';
import { SalonReservationRescheduleInput } from '../../libs/dto/salon-reservation/salon-reservation.reschedule.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SalonReservationService } from './salon-reservation.service';

@Resolver()
export class SalonReservationResolver {
  constructor(private readonly reservationService: SalonReservationService) {}

  @UseGuards(AuthGuard)
  @Query(() => [SalonReservation])
  getMySalonReservations(
    @AuthMember('_id') customerId: string,
  ): Promise<SalonReservation[]> {
    return this.reservationService.listForCustomer(customerId);
  }

  @Query(() => [Date])
  getBookedSalonTimes(
    @Args('suiteId') suiteId: string,
    @Args('from', { type: () => Date }) from: Date,
    @Args('to', { type: () => Date }) to: Date,
  ): Promise<Date[]> {
    return this.reservationService.listBookedTimes(suiteId, from, to);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => SalonReservation)
  createSalonReservation(
    @Args('input') input: SalonReservationInput,
    @AuthMember('_id') customerId: string,
  ): Promise<SalonReservation> {
    return this.reservationService.create(customerId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  deletePastSalonReservation(
    @Args('reservationId') reservationId: string,
    @AuthMember('_id') customerId: string,
  ): Promise<boolean> {
    return this.reservationService.deletePastReservation(customerId, reservationId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => SalonReservation)
  rescheduleMySalonReservation(
    @Args('input') input: SalonReservationRescheduleInput,
    @AuthMember('_id') customerId: string,
  ): Promise<SalonReservation> {
    return this.reservationService.rescheduleReservation(
      customerId,
      input.reservationId,
      input.bookingDate,
      input.bookingTime,
    );
  }

  @UseGuards(AuthGuard)
  @Mutation(() => SalonReservation)
  cancelMySalonReservation(
    @Args('reservationId') reservationId: string,
    @AuthMember('_id') customerId: string,
  ): Promise<SalonReservation> {
    return this.reservationService.cancelReservation(customerId, reservationId);
  }
}
