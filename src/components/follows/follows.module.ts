import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import { AuthModule } from '../auth/auth.module';
import { MembersModule } from '../members/members.module';
import { FollowService } from './follow.service';
import { FollowResolver } from './follow.resolver';

@Module({
	imports: [AuthModule, MembersModule, MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }])],
	providers: [FollowService, FollowResolver],
})
export class FollowsModule {}
