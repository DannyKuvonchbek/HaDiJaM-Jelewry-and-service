import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ProductSchema from "../../schemas/Product.model";
import { ProductResolver } from "./product.resolver";
import { ProductService } from "./product.service";
import { MembersModule } from "../members/members.module";
import { LikesModule } from "../likes/likes.module";
import { ViewsModule } from "../views/views.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    MembersModule,
    LikesModule,
    ViewsModule,
    MongooseModule.forFeature([{ name: "Product", schema: ProductSchema }]),
  ],
  providers: [ProductResolver, ProductService],
  exports: [ProductService],
})
export class ProductsModule {}
