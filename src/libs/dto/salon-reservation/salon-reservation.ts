import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';

@ObjectType()
export class SalonReservation {
  @Field(() => String)
  _id!: ObjectId;

  @Field(() => String)
  reservationReference!: string;

  @Field(() => String)
  reservationStatus!: string;

  @Field(() => String)
  suiteId!: string;

  @Field(() => String)
  suiteName!: string;

  @Field(() => Date)
  bookingDate!: Date;

  @Field(() => Date)
  bookingTime!: Date;

  @Field(() => String)
  guestName!: string;

  @Field(() => String)
  guestContact!: string;

  @Field(() => String, { nullable: true })
  itemManifest?: string;

  @Field(() => [String])
  selectedAmenities!: string[];

  @Field(() => Boolean)
  valetRequested!: boolean;
}
