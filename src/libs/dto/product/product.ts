import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ProductStatus } from '../../enums/product.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Product {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	productType!: string;

	@Field(() => ProductStatus)
	productStatus!: ProductStatus;

	@Field(() => String)
	productTitle!: string;

	@Field(() => Float)
	productPrice!: number;

	@Field(() => Int)
	productViews!: number;

	@Field(() => Int)
	productLikes!: number;

	@Field(() => Int)
	productComments!: number;

	@Field(() => Int)
	productRank!: number;

	@Field(() => [String])
	productImages!: string[];

	@Field(() => String, { nullable: true })
	productDesc?: string;

	@Field(() => Boolean)
	productBarter!: boolean;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	constructedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Products {
	@Field(() => [Product])
	list!: Product[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
