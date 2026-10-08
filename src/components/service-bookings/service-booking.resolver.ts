import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
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
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ServiceBookingService } from "./service-booking.service";

@Resolver()
export class ServiceBookingResolver {
  constructor(private readonly bookingService: ServiceBookingService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => ServiceBooking)
  public async createServiceBooking(
    @Args("input") input: ServiceBookingInput,
    @AuthMember("_id") customerId: string,
  ): Promise<ServiceBooking> {
    return await this.bookingService.createBooking(customerId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => [String])
  public async getUnavailableServiceBookingSlots(
    @Args("input") input: ServiceBookingAvailabilityInput,
  ): Promise<string[]> {
    return this.bookingService.getUnavailableSlots(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => ServiceBooking)
  public async updateServiceBooking(
    @Args("input") input: ServiceBookingUpdate,
    @AuthMember("_id") memberId: string,
  ): Promise<ServiceBooking> {
    return this.bookingService.updateBooking(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => ServiceBookings)
  public async getMyServiceBookings(
    @Args("input") input: ServiceBookingsInquiry,
    @AuthMember("_id") memberId: string,
  ): Promise<ServiceBookings> {
    return this.bookingService.getMemberBookings(memberId, input);
  }
}
