import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import {
  ServiceDeliveries,
  ServiceDelivery,
} from "../../libs/dto/service-delivery/service-delivery";
import {
  ServiceDeliveriesInquiry,
  ServiceDeliveryInput,
} from "../../libs/dto/service-delivery/service-delivery.input";
import { ServiceDeliveryUpdate } from "../../libs/dto/service-delivery/service-delivery.update";
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ServiceDeliveryService } from "./service-delivery.service";

@Resolver()
export class ServiceDeliveryResolver {
  constructor(private readonly deliveryService: ServiceDeliveryService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => ServiceDelivery)
  public async createServiceDelivery(
    @Args("input") input: ServiceDeliveryInput,
    @AuthMember("_id") memberId: string,
  ): Promise<ServiceDelivery> {
    return this.deliveryService.createDelivery(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => ServiceDelivery)
  public async updateServiceDelivery(
    @Args("input") input: ServiceDeliveryUpdate,
    @AuthMember("_id") memberId: string,
  ): Promise<ServiceDelivery> {
    return this.deliveryService.updateDelivery(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => ServiceDeliveries)
  public async getMyServiceDeliveries(
    @Args("input") input: ServiceDeliveriesInquiry,
    @AuthMember("_id") memberId: string,
  ): Promise<ServiceDeliveries> {
    return this.deliveryService.getMyDeliveries(memberId, input);
  }
}
