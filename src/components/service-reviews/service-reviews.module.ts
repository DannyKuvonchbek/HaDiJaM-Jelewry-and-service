import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceReviewSchema from '../../schemas/ServiceReview.model';
import ServiceBookingSchema from '../../schemas/ServiceBooking.model';
import { AuthModule } from '../auth/auth.module';
import { ServiceReviewResolver } from './service-review.resolver';
import { ServiceReviewService } from './service-review.service';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([
		{ name: 'ServiceReview', schema: ServiceReviewSchema },
		{ name: 'ServiceBooking', schema: ServiceBookingSchema },
	])],
	providers: [ServiceReviewResolver, ServiceReviewService],
})
export class ServiceReviewsModule {}
