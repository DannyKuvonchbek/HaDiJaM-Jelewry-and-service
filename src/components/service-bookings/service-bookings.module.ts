import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ServiceBookingSchema from "../../schemas/ServiceBooking.model";
import ServiceSchema from "../../schemas/Service.model";
import ServiceScheduleSchema from "../../schemas/ServiceSchedule.model";
import { AuthModule } from "../auth/auth.module";
import { ServiceBookingResolver } from "./service-booking.resolver";
import { ServiceBookingService } from "./service-booking.service";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: "ServiceBooking", schema: ServiceBookingSchema },
      { name: "Service", schema: ServiceSchema },
      { name: "ServiceSchedule", schema: ServiceScheduleSchema },
    ]),
  ],
  providers: [ServiceBookingResolver, ServiceBookingService],
})
export class ServiceBookingsModule {}
