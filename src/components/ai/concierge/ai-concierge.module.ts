import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import AIConversationSchema from "../../../schemas/AIConversation.model";
import AIConversationMessageSchema from "../../../schemas/AIConversationMessage.model";
import ProductSchema from "../../../schemas/Product.model";
import ServiceSchema from "../../../schemas/Service.model";
import MemberSchema from "../../../schemas/Member.model";
import { AuthModule } from "../../auth/auth.module";
import { AIConciergeResolver } from "./ai-concierge.resolver";
import { AIConciergeService } from "./ai-concierge.service";
import { SiteConciergeAnswerService } from "./site-concierge-answer.service";
@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: "AIConversation", schema: AIConversationSchema },
      { name: "AIConversationMessage", schema: AIConversationMessageSchema },
      { name: "Product", schema: ProductSchema },
      { name: "Service", schema: ServiceSchema },
      { name: "Member", schema: MemberSchema },
    ]),
  ],
  providers: [AIConciergeResolver, AIConciergeService, SiteConciergeAnswerService],
})
export class AIConciergeModule {}
