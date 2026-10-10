import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AtelierChatMessageSchema from '../../schemas/AtelierChatMessage.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { AtelierChatGateway } from './atelier-chat.gateway';
import { AtelierChatResolver } from './atelier-chat.resolver';
import { AtelierChatService } from './atelier-chat.service';
import { AtelierSocialResolver, AtelierSocialService } from './atelier-social.resolver';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([{ name: 'AtelierChatMessage', schema: AtelierChatMessageSchema }, { name: 'Member', schema: MemberSchema }])],
	providers: [AtelierChatGateway, AtelierChatResolver, AtelierChatService, AtelierSocialResolver, AtelierSocialService],
})
export class AtelierChatModule {}
