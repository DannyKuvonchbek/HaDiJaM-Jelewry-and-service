import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { ProductStatus } from '../../enums/product.enum';
import { availableProductSorts } from '../../config';

@InputType()
export class ProductInput {
	@IsNotEmpty()
	@Field(() => String)
	productType!: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	productTitle!: string;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	productPrice!: number;

	@IsNotEmpty()
	@Field(() => [String])
	productImages!: string[];

	@IsOptional()
	@Length(1, 2000)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	productBarter?: boolean;
}

@InputType()
export class ProductUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	productType?: string;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productTitle?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	productPrice?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	productImages?: string[];

	@IsOptional()
	@Length(1, 2000)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	productBarter?: boolean;
}

@InputType()
class ProductSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	productType?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	minPrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	maxPrice?: number;
}

@InputType()
export class ProductsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ProductSearch)
	search!: ProductSearch;
}

@InputType()
class SellerProductSearch {
	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;
}

@InputType()
export class SellerProductsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => SellerProductSearch)
	search!: SellerProductSearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;
}
