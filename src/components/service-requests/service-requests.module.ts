import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceRequestSchema from '../../schemas/ServiceRequest.model';
import ServiceSchema from '../../schemas/Service.model';
import ServiceBookingSchema from '../../schemas/ServiceBooking.model';
import { AuthModule } from '../auth/auth.module';
import { ServiceRequestResolver } from './service-request.resolver';
import { ServiceRequestService } from './service-request.service';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([
		{ name: 'ServiceRequest', schema: ServiceRequestSchema },
		{ name: 'Service', schema: ServiceSchema },
		{ name: 'ServiceBooking', schema: ServiceBookingSchema },
	])],
	providers: [ServiceRequestResolver, ServiceRequestService],
})
export class ServiceRequestsModule {}
