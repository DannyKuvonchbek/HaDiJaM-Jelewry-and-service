import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import OrderSchema from "../../schemas/Order.model";
import OrderItemSchema from "../../schemas/OrderItem.model";
import ProductSchema from "../../schemas/Product.model";
import { AuthModule } from "../auth/auth.module";
import { OrderResolver } from "./order.resolver";
import { OrderService } from "./order.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "Order", schema: OrderSchema },
      { name: "OrderItem", schema: OrderItemSchema },
      { name: "Product", schema: ProductSchema },
    ]),
    AuthModule,
  ],
  providers: [OrderResolver, OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
