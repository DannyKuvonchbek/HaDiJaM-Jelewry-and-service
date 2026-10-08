import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class SalonReservationInput {
  @Field(() => String) @IsNotEmpty() @IsString()
  suiteId!: string;

  @Field(() => String) @IsNotEmpty() @IsString()
  suiteName!: string;

  @Field(() => Date) @IsDate()
  bookingDate!: Date;

  @Field(() => Date) @IsDate()
  bookingTime!: Date;

  @Field(() => String) @IsNotEmpty() @IsString()
  guestName!: string;

  @Field(() => String) @IsNotEmpty() @IsString()
  guestContact!: string;

  @Field(() => String, { nullable: true }) @IsOptional() @IsString()
  itemManifest?: string;

  @Field(() => [String]) @IsArray()
  selectedAmenities!: string[];

  @Field(() => Boolean) @IsBoolean()
  valetRequested!: boolean;
}
