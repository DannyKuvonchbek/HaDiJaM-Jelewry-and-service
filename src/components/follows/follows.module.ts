import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import FollowSchema from '../../schemas/Follow.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { FollowService } from './follow.service';
import { FollowResolver } from './follow.resolver';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([{ name: 'Follow', schema: FollowSchema }, { name: 'Member', schema: MemberSchema }])],
	providers: [FollowService, FollowResolver],
})
export class FollowsModule {}
