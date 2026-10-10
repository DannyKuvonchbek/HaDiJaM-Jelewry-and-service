import { Context, Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { Member } from "../../libs/dto/member/member";
@Resolver(() => Member)
export class MemberPrivacyResolver {
  private allowed(member: Member, context: any): boolean {
    const actor = context.req?.authMember;
    return (
      actor &&
      (actor.memberType === "ADMIN" || String(actor._id) === String(member._id))
    );
  }
  @ResolveField(() => String) memberPhone(
    @Parent() member: Member,
    @Context() context: any,
  ) {
    return this.allowed(member, context) ? member.memberPhone : "";
  }
  @ResolveField(() => String, { nullable: true }) memberAddress(
    @Parent() member: Member,
    @Context() context: any,
  ) {
    return this.allowed(member, context) ? member.memberAddress : null;
  }
}
