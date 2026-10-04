import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { MemberService } from "./member.service";
import { Member, Members } from "../../libs/dto/member/member";
import {
  SellersInquiry,
  LoginInput,
  MemberInput,
  MembersInquiry,
} from "../../libs/dto/member/member.input";
import { MemberUpdate } from "../../libs/dto/member/member.update";
import { AuthGuard } from "../auth/guards/auth.guard";
import { WithoutGuard } from "../auth/guards/without.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthMember } from "../auth/decorators/authMember.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { MemberType } from "../../libs/enums/member.enum";
import { GraphQLUpload, FileUpload } from "graphql-upload";
import { createWriteStream, mkdirSync } from "fs";
import { basename, resolve } from "path";
import { randomUUID } from "crypto";
import {
  getSerialForImage,
  shapeIntoMongoObjectId,
  validMimeTypes,
} from "../../libs/config";
import { Message } from "../../libs/enums/common.enum";
import { ObjectId } from "bson";

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}

  @Mutation(() => Member)
  public async signup(@Args("input") input: MemberInput): Promise<Member> {
    console.log("input", input);
    return await this.memberService.signup(input);
  }

  @Mutation(() => Member)
  public async login(@Args("input") input: LoginInput): Promise<Member> {
    console.log("Mutation: login");
    return await this.memberService.login(input);
  }

  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(
    @AuthMember("memberNick") memberNick: string,
  ): Promise<string> {
    console.log("Query: checkAuth");
    console.log("memberNick: memberNick");
    return await `Hi ${memberNick}`;
  }

  @Roles(MemberType.USER, MemberType.SELLER)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRoles(
    @AuthMember() authMember: Member,
  ): Promise<string> {
    console.log("Query: checkAuthRoles");
    console.log("memberNick: memberNick");
    return await `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async updateMember(
    @Args("input") input: MemberUpdate,
    @AuthMember("_id") memberId: ObjectId,
  ): Promise<Member> {
    console.log("Mutation: updateMember");
    delete input._id;
    return await this.memberService.updateMember(String(memberId), input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Member)
  public async getMember(
    @Args("memberId") input: string,
    @AuthMember("_id") memberId: ObjectId,
  ): Promise<Member> {
    console.log("Query: getMember");
    const targetId = shapeIntoMongoObjectId(input);
    return this.memberService.getMember(String(memberId), String(targetId));
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async likeTargetMember(
    @Args("memberId") targetMemberId: string,
    @AuthMember("_id") memberId: string,
  ): Promise<Member> {
    return this.memberService.likeTargetMember(memberId, targetMemberId);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Members)
  public async getSellers(
    @Args("input") input: SellersInquiry,
    @AuthMember("_id") memberId?: string,
  ): Promise<Members> {
    return this.memberService.getSellers(memberId, input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Members)
  public async getAllMembersByAdmin(
    @Args("input") input: MembersInquiry,
  ): Promise<Members> {
    return this.memberService.getAllMembersByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async updateMembersByAdmin(
    @Args("input") input: MemberUpdate,
  ): Promise<Member> {
    return this.memberService.updateMembersByAdmin(input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async imageUploader(
    @Args({ name: "file", type: () => GraphQLUpload })
    file: unknown,
    @Args("target") target: string,
  ): Promise<string> {
    const upload = (await file) as FileUpload;
    if (!validMimeTypes.includes(upload.mimetype))
      throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
    const targetPath = this.getUploadTarget(target);
    mkdirSync(targetPath, { recursive: true });
    const filename = getSerialForImage(upload.filename);
    const output = resolve(targetPath, filename);
    await new Promise<void>((resolvePromise, reject) => {
      upload
        .createReadStream()
        .pipe(createWriteStream(output))
        .on("finish", resolvePromise)
        .on("error", reject);
    });
    return `uploads/${target}/${filename}`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => [String])
  public async imagesUploader(
    @Args("files", { type: () => [GraphQLUpload] })
    files: Promise<FileUpload>[],
    @Args("target") target: string,
  ): Promise<string[]> {
    const targetPath = this.getUploadTarget(target);
    mkdirSync(targetPath, { recursive: true });
    return Promise.all(
      files.map(async (file) => {
        const upload = await file;
        if (!validMimeTypes.includes(upload.mimetype))
          throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
        const filename = getSerialForImage(upload.filename);
        const output = resolve(targetPath, filename);
        await new Promise<void>((resolvePromise, reject) => {
          upload
            .createReadStream()
            .pipe(createWriteStream(output))
            .on("finish", resolvePromise)
            .on("error", reject);
        });
        return `uploads/${target}/${filename}`;
      }),
    );
  }

  private getUploadTarget(target: string): string {
    const normalized = basename(target);
    if (!target || normalized !== target || !/^[a-zA-Z0-9_-]+$/.test(target))
      throw new Error(Message.BAD_REQUEST);
    return resolve(process.cwd(), "uploads", target);
  }
}
