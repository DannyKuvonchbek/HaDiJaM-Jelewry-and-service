import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Order, Orders } from "../../libs/dto/order/order";
import { OrderItem } from "../../libs/dto/order-item/order-item";
import { MemberType } from "../../libs/enums/member.enum";
import {
  OrderAdminUpdate,
  OrderInput,
  OrderItemUpdate,
  OrdersInquiry,
  OrderUpdate,
} from "../../libs/dto/order/order.input";
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { OrderService } from "./order.service";

@Resolver()
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Roles(MemberType.USER, MemberType.SELLER, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Order)
  public async createOrder(
    @Args("input") input: OrderInput,
    @AuthMember("_id") memberId: string,
  ): Promise<Order> {
    return this.orderService.createOrder(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Order)
  public async updateOrder(
    @Args("input") input: OrderUpdate,
    @AuthMember("_id") memberId: string,
    @AuthMember("memberType") memberType: MemberType,
  ): Promise<Order> {
    return this.orderService.updateOrder(memberId, input, memberType === MemberType.ADMIN);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => OrderItem)
  public async updateOrderItem(
    @Args("input") input: OrderItemUpdate,
    @AuthMember("_id") memberId: string,
    @AuthMember("memberType") memberType: MemberType,
  ): Promise<OrderItem> {
    return this.orderService.updateOrderItem(memberId, input, memberType === MemberType.ADMIN);
  }

  @UseGuards(AuthGuard)
  @Query(() => Orders)
  public async getMyOrders(
    @Args("input") input: OrdersInquiry,
    @AuthMember("_id") memberId: string,
  ): Promise<Orders> {
    return this.orderService.getMemberOrders(memberId, input);
  }

  @Roles(MemberType.SELLER)
  @UseGuards(RolesGuard)
  @Query(() => Orders)
  public async getSellerOrders(
    @Args("input") input: OrdersInquiry,
    @AuthMember("_id") sellerId: string,
  ): Promise<Orders> {
    return this.orderService.getSellerOrders(sellerId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Orders)
  public async getAllOrdersByAdmin(@Args("input") input: OrdersInquiry): Promise<Orders> {
    return this.orderService.getAllOrdersByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Order)
  public async updateOrderByAdmin(@Args("input") input: OrderAdminUpdate): Promise<Order> {
    return this.orderService.updateOrderByAdmin(input);
  }
}
