import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import MemberSchema from "../../schemas/Member.model";
import { MemberResolver } from "./member.resolver";
import { MemberService } from "./member.service";
import { AuthModule } from "../auth/auth.module";
import { LikesModule } from "../likes/likes.module";
import { ViewsModule } from "../views/views.module";
import FollowSchema from "../../schemas/Follow.model";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Member", schema: MemberSchema }, { name: "Follow", schema: FollowSchema }]),
    AuthModule,
    LikesModule,
    ViewsModule,
  ],
  providers: [MemberResolver, MemberService],
  exports: [MemberService],
})
export class MembersModule {}
