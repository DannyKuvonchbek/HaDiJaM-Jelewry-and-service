import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceSchema from '../../schemas/Service.model';
import { ServiceResolver } from './service.resolver';
import { ServiceService } from './service.service';
import { LikesModule } from '../likes/likes.module';
import { ViewsModule } from '../views/views.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [AuthModule, LikesModule, ViewsModule, MongooseModule.forFeature([
		{ name: 'Service', schema: ServiceSchema },
	])],
	providers: [ServiceResolver, ServiceService],
	exports: [ServiceService],
})
export class ServicesModule {}
