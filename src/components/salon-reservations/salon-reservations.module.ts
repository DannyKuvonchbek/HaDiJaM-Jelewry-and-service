import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import SalonReservationSchema from '../../schemas/SalonReservation.model';
import { AuthModule } from '../auth/auth.module';
import { SalonReservationResolver } from './salon-reservation.resolver';
import { SalonReservationService } from './salon-reservation.service';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: 'SalonReservation', schema: SalonReservationSchema }])],
  providers: [SalonReservationResolver, SalonReservationService],
})
export class SalonReservationsModule {}
