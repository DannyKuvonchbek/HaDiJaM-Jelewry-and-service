import { Transform } from 'stream';
import { randomUUID } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { requireBrowserRequest, limitAuth, setRefresh } from '../auth/sessions/auth-security';
import { Args, Mutation, Query, Resolver, Context } from "@nestjs/graphql";
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
import { pipeline } from "stream/promises";
import { unlink } from "fs/promises";
import {
  getSerialForImage,
  shapeIntoMongoObjectId,
  validMimeTypes,
} from "../../libs/config";
import { Message } from "../../libs/enums/common.enum";
import { ObjectId } from "bson";

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService, private readonly authService: AuthService) {}

  @Mutation(() => Member)
  public async signup(@Args("input") input: MemberInput, @Context() context: any): Promise<Member> {
    requireBrowserRequest(context.req); limitAuth(context.req, "signup", 10);
    return this.attachSession(await this.memberService.signup(input), context);
  }

  @Mutation(() => Member)
  public async login(@Args("input") input: LoginInput, @Context() context: any): Promise<Member> {
    requireBrowserRequest(context.req); limitAuth(context.req, "login");
    return this.attachSession(await this.memberService.login(input), context);
  }

  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(
    @AuthMember("memberNick") memberNick: string,
  ): Promise<string> {
    return await `Hi ${memberNick}`;
  }

  @Roles(MemberType.USER, MemberType.SELLER)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRoles(
    @AuthMember() authMember: Member,
  ): Promise<string> {
    return await `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async updateMember(
    @Args("input") input: MemberUpdate,
    @AuthMember("_id") memberId: ObjectId,
  ): Promise<Member> {
    delete input._id;
    return await this.memberService.updateMember(String(memberId), input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Member)
  public async getMember(
    @Args("memberId") input: string,
    @AuthMember("_id") memberId: ObjectId,
  ): Promise<Member> {
    const targetId = shapeIntoMongoObjectId(input);
    return this.memberService.getMember(memberId ? String(memberId) : "", String(targetId));
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
    @AuthMember("_id") ownerId?: string,
  ): Promise<string> {
    const upload = (await file) as FileUpload;
    if (!validMimeTypes.includes(upload.mimetype))
      throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
    const targetPath = this.getUploadTarget(target);
    mkdirSync(targetPath, { recursive: true });
    const filename = this.uploadFilename(upload, target, ownerId);
    const output = resolve(targetPath, filename);
    await this.writeUpload(upload, output, target === "member" ? 8 * 1024 * 1024 : 25 * 1024 * 1024);
    return `uploads/${target}/${filename}`;
  }

  @UseGuards(AuthGuard)
  @Mutation(() => [String])
  public async imagesUploader(
    @Args("files", { type: () => [GraphQLUpload] })
    files: Promise<FileUpload>[],
    @Args("target") target: string,
    @AuthMember("_id") ownerId?: string,
  ): Promise<string[]> {
    const targetPath = this.getUploadTarget(target);
    mkdirSync(targetPath, { recursive: true });
    return Promise.all(
      files.map(async (file) => {
        const upload = await file;
        if (!validMimeTypes.includes(upload.mimetype))
          throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
        const filename = this.uploadFilename(upload, target, ownerId);
        const output = resolve(targetPath, filename);
        await this.writeUpload(upload, output, target === "member" ? 8 * 1024 * 1024 : 25 * 1024 * 1024);
        return `uploads/${target}/${filename}`;
      }),
    );
  }

  private async attachSession(member: Member, context: any): Promise<Member> {
    const session = await this.authService.createSession(member);
    setRefresh(context.res, session.refreshToken, session.expiresAt);
    member.accessToken = session.accessToken;
    context.req.authMember = member;
    return member;
  }

  private async writeUpload(upload: FileUpload, output: string, maxBytes: number): Promise<void> {
    try {
      let length=0, header=Buffer.alloc(0), validated=false;
      const check=(bytes:Buffer)=>{
        const actual = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
          : bytes[0]===255&&bytes[1]===216&&bytes[2]===255 ? 'image/jpeg'
          : /^GIF8[79]a/.test(bytes.subarray(0,6).toString()) ? 'image/gif'
          : bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP' ? 'image/webp'
          : bytes.subarray(4,8).toString()==='ftyp'&&/(heic|heix|hevc|hevx|mif1|msf1)/.test(bytes.subarray(8,32).toString()) ? upload.mimetype : null;
        if(actual!==upload.mimetype)throw new Error('Image contents do not match the declared format.');
      };
      const validate=new Transform({transform(chunk,_encoding,done){
        try{length+=chunk.length;if(length>maxBytes)throw new Error('Image is too large.');
          if(!validated){header=Buffer.concat([header,chunk]);if(header.length<32)return done();check(header);validated=true;this.push(header);header=Buffer.alloc(0);}
          else this.push(chunk);done();
        }catch(error){done(error as Error);}
      },flush(done){try{if(!validated){check(header);this.push(header);}done();}catch(error){done(error as Error);}}});
      await pipeline(upload.createReadStream(), validate, createWriteStream(output, {flags:'wx'}));
    } catch (error) {
      // Remove incomplete files after source, size-limit, or disk errors.
      await unlink(output).catch(() => undefined);
      throw error;
    }
  }

  private uploadFilename(upload: FileUpload, target: string, ownerId?: string): string {
    const extensions: Record<string,string> = {'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','image/heic':'.heic','image/heif':'.heif'};
    const privateTarget=['atelier','service-bookings'].includes(target);
    if(privateTarget && !ownerId)throw new Error('Please sign in.');
    return `${privateTarget ? String(ownerId)+'-' : ''}${randomUUID()}${extensions[upload.mimetype]}`;
  }

  private getUploadTarget(target: string): string {
    const normalized = basename(target);
    if (!target || normalized !== target || !/^[a-zA-Z0-9_-]+$/.test(target))
      throw new Error(Message.BAD_REQUEST);
    return resolve(process.cwd(), "uploads", target);
  }
}
