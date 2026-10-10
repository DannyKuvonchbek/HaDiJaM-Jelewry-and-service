import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

@InputType()
export class SellerApplicationInput {
  @IsString() @Length(2, 150) @Field() businessName!: string;
  @IsString() @Length(5, 500) @Field() businessAddress!: string;
  @IsMongoId() @Field() idDocumentId!: string;
  @IsMongoId() @Field() businessDocumentId!: string;
}
@InputType()
export class SellerReviewInput {
  @IsMongoId() @Field() applicationId!: string;
  @IsInt() @Min(1) @Field(() => Int) revision!: number;
  @IsIn(["APPROVED", "REJECTED"]) @Field() decision!: string;
  @IsOptional()
  @IsString()
  @Length(5, 2000)
  @Field({ nullable: true })
  reason?: string;
}
@InputType()
export class AdminPageInput {
  @IsInt() @Min(1) @Field(() => Int) page!: number;
  @IsInt() @Min(1) @Max(100) @Field(() => Int) limit!: number;
  @IsOptional()
  @IsString()
  @Length(0, 150)
  @Field({ nullable: true })
  search?: string;
  @IsOptional() @IsString() @Field({ nullable: true }) status?: string;
}
@ObjectType()
export class SellerApplication {
  @Field() _id!: string;
  @Field() memberId!: string;
  @Field() businessName!: string;
  @Field() businessAddress!: string;
  @Field() idDocumentId!: string;
  @Field() businessDocumentId!: string;
  @Field() status!: string;
  @Field(() => Int) revision!: number;
  @Field({ nullable: true }) rejectionReason?: string;
  @Field({ nullable: true }) reviewedBy?: string;
  @Field(() => Date, { nullable: true }) reviewedAt?: Date;
  @Field(() => Date) createdAt!: Date;
  @Field(() => Date) updatedAt!: Date;
  @Field({ nullable: true }) memberNick?: string;
  @Field({ nullable: true }) memberPhone?: string;
}
@ObjectType()
export class SellerApplicationPage {
  @Field(() => [SellerApplication]) list!: SellerApplication[];
  @Field(() => Int) total!: number;
  @Field(() => Int) pendingCount!: number;
}
@ObjectType()
export class AdminRecord {
  @Field() _id!: string;
  @Field() data!: string;
}
@ObjectType()
export class AdminRecordPage {
  @Field(() => [AdminRecord]) list!: AdminRecord[];
  @Field(() => Int) total!: number;
}
@InputType()
export class AdminRecordUpdate {
  @IsIn([
    "services",
    "orders",
    "orderItems",
    "bookings",
    "salon",
    "requests",
    "deliveries",
    "reviews",
    "articles",
    "comments",
  ])
  @Field()
  domain!: string;
  @IsMongoId() @Field() id!: string;
  @IsString() @Length(2, 10000) @Field() changes!: string;
}
