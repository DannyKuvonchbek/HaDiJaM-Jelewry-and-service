import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CommentSchema from '../../schemas/Comment.model';
import MemberSchema from '../../schemas/Member.model';
import ProductSchema from '../../schemas/Product.model';
import ServiceSchema from '../../schemas/Service.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { AuthModule } from '../auth/auth.module';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([
		{ name: 'Comment', schema: CommentSchema },
		{ name: 'Member', schema: MemberSchema },
		{ name: 'Product', schema: ProductSchema },
		{ name: 'Service', schema: ServiceSchema },
		{ name: 'BoardArticle', schema: BoardArticleSchema },
	])],
	providers: [CommentService, CommentResolver],
})
export class CommentsModule {}
