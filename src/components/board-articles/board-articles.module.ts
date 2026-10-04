import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import BoardConfigSchema from '../../schemas/BoardConfig.model';
import MemberSchema from '../../schemas/Member.model';
import { LikesModule } from '../likes/likes.module';
import { AuthModule } from '../auth/auth.module';
import { BoardArticleService } from './board-article.service';
import { BoardArticleResolver } from './board-article.resolver';

@Module({
	imports: [AuthModule, LikesModule, MongooseModule.forFeature([
		{ name: 'BoardArticle', schema: BoardArticleSchema },
		{ name: 'BoardConfig', schema: BoardConfigSchema },
		{ name: 'Member', schema: MemberSchema },
	])],
	providers: [BoardArticleService, BoardArticleResolver],
})
export class BoardArticlesModule {}
