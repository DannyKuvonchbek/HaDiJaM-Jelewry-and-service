import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceScheduleSchema from '../../schemas/ServiceSchedule.model';
import ServiceSchema from '../../schemas/Service.model';
import { AuthModule } from '../auth/auth.module';
import { ServiceScheduleResolver } from './service-schedule.resolver';
import { ServiceScheduleService } from './service-schedule.service';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([
		{ name: 'ServiceSchedule', schema: ServiceScheduleSchema },
		{ name: 'Service', schema: ServiceSchema },
	])],
	providers: [ServiceScheduleResolver, ServiceScheduleService],
})
export class ServiceSchedulesModule {}
