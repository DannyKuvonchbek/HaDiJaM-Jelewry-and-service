import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class SalonReservationRescheduleInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  reservationId!: string;

  @Field(() => Date)
  @IsDate()
  bookingDate!: Date;

  @Field(() => Date)
  @IsDate()
  bookingTime!: Date;
}
