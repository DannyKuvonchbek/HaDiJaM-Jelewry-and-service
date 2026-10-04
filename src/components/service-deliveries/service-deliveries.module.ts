import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ServiceDeliverySchema from "../../schemas/ServiceDelivery.model";
import ServiceBookingSchema from "../../schemas/ServiceBooking.model";
import ServiceRequestSchema from "../../schemas/ServiceRequest.model";
import ServiceSchema from "../../schemas/Service.model";
import { AuthModule } from "../auth/auth.module";
import { ServiceDeliveryResolver } from "./service-delivery.resolver";
import { ServiceDeliveryService } from "./service-delivery.service";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: "ServiceDelivery", schema: ServiceDeliverySchema },
      { name: "Service", schema: ServiceSchema },
      { name: "ServiceBooking", schema: ServiceBookingSchema },
      { name: "ServiceRequest", schema: ServiceRequestSchema },
    ]),
  ],
  providers: [ServiceDeliveryResolver, ServiceDeliveryService],
})
export class ServiceDeliveriesModule {}
