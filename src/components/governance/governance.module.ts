import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { GovernanceService } from "./governance.service";
import { GovernanceResolver } from "./governance.resolver";
import { AdminRecordsService } from "./admin-records.service";
import { AdminAuditInterceptor } from "./admin-audit.interceptor";
import {
  PrivateDocumentsController,
  DocumentAuthGuard,
} from "./private-documents.controller";
import { SmsService } from "./sms.service";
import {
  SellerApplicationSchema,
  PrivateDocumentSchema,
  SmsJobSchema,
  AuditSchema,
} from "./governance.schemas";
import MemberSchema from "../../schemas/Member.model";
import NotificationSchema from "../../schemas/Notification.model";
import ServiceSchema from "../../schemas/Service.model";
import OrderSchema from "../../schemas/Order.model";
import OrderItemSchema from "../../schemas/OrderItem.model";
import ServiceBookingSchema from "../../schemas/ServiceBooking.model";
import SalonReservationSchema from "../../schemas/SalonReservation.model";
import ServiceRequestSchema from "../../schemas/ServiceRequest.model";
import ServiceDeliverySchema from "../../schemas/ServiceDelivery.model";
import ServiceReviewSchema from "../../schemas/ServiceReview.model";
import BoardArticleSchema from "../../schemas/BoardArticle.model";
import CommentSchema from "../../schemas/Comment.model";
@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: "Member", schema: MemberSchema },
      { name: "Notification", schema: NotificationSchema },
      { name: "Service", schema: ServiceSchema },
      { name: "Order", schema: OrderSchema },
      { name: "OrderItem", schema: OrderItemSchema },
      { name: "ServiceBooking", schema: ServiceBookingSchema },
      { name: "SalonReservation", schema: SalonReservationSchema },
      { name: "ServiceRequest", schema: ServiceRequestSchema },
      { name: "ServiceDelivery", schema: ServiceDeliverySchema },
      { name: "ServiceReview", schema: ServiceReviewSchema },
      { name: "BoardArticle", schema: BoardArticleSchema },
      { name: "Comment", schema: CommentSchema },
      { name: "SellerApplication", schema: SellerApplicationSchema },
      { name: "PrivateDocument", schema: PrivateDocumentSchema },
      { name: "SmsJob", schema: SmsJobSchema },
      { name: "AdminAudit", schema: AuditSchema },
    ]),
  ],
  controllers: [PrivateDocumentsController],
  providers: [
    GovernanceService,
    GovernanceResolver,
    AdminRecordsService,
    DocumentAuthGuard,
    SmsService,
    { provide: APP_INTERCEPTOR, useClass: AdminAuditInterceptor },
  ],
})
export class GovernanceModule {}
