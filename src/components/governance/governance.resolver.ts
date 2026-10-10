import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { MemberType } from "../../libs/enums/member.enum";
import { GovernanceService } from "./governance.service";
import { AdminRecordsService } from "./admin-records.service";
import {
  AdminPageInput,
  AdminRecord,
  AdminRecordPage,
  AdminRecordUpdate,
  SellerApplication,
  SellerApplicationInput,
  SellerApplicationPage,
  SellerReviewInput,
} from "./governance.dto";
@Resolver()
export class GovernanceResolver {
  constructor(
    private service: GovernanceService,
    private records: AdminRecordsService,
  ) {}
  @UseGuards(AuthGuard)
  @Mutation(() => SellerApplication)
  submitSellerApplication(
    @AuthMember("_id") memberId: string,
    @Args("input") input: SellerApplicationInput,
  ) {
    return this.service.submit(memberId, input);
  }
  @UseGuards(AuthGuard)
  @Query(() => SellerApplication, { nullable: true })
  getMySellerApplication(@AuthMember("_id") memberId: string) {
    return this.service.mine(memberId);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => SellerApplicationPage)
  getSellerApplicationsByAdmin(@Args("input") input: AdminPageInput) {
    return this.service.list(input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => SellerApplication)
  reviewSellerApplication(
    @AuthMember("_id") adminId: string,
    @Args("input") input: SellerReviewInput,
  ) {
    return this.service.review(adminId, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => AdminRecordPage)
  getAdminRecords(
    @Args("domain") domain: string,
    @Args("input") input: AdminPageInput,
  ) {
    return this.records.list(domain, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => AdminRecord)
  updateAdminRecord(
    @AuthMember("_id") adminId: string,
    @Args("input") input: AdminRecordUpdate,
  ) {
    return this.records.update(adminId, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Boolean)
  requeueSmsByAdmin(
    @AuthMember("_id") adminId: string,
    @Args("jobId") jobId: string,
  ) {
    return this.service.releaseSms(adminId, jobId);
  }
}
