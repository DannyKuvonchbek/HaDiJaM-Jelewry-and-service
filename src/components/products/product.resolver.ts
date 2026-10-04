import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Product, Products } from '../../libs/dto/product/product';
import { SellerProductsInquiry, OrdinaryInquiry, ProductInput, ProductUpdate, ProductsInquiry } from '../../libs/dto/product/product.input';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ProductService } from './product.service';

@Resolver()
export class ProductResolver {
	constructor(private readonly productService: ProductService) {}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async createProduct(@Args('input') input: ProductInput, @AuthMember('_id') memberId: string): Promise<Product> {
		return this.productService.createProduct(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Product)
	public async getProduct(@Args('productId') productId: string, @AuthMember('_id') memberId: string): Promise<Product> {
		return this.productService.getProduct(productId, memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Product)
	public async likeTargetProduct(@Args('productId') productId: string, @AuthMember('_id') memberId: string): Promise<Product> {
		return this.productService.likeTargetProduct(memberId, productId);
	}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async updateProduct(@Args('input') input: ProductUpdate, @AuthMember('_id') memberId: string): Promise<Product> {
		return this.productService.updateProduct(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Products)
	public async getProducts(@Args('input') input: ProductsInquiry): Promise<Products> {
		return this.productService.getProducts(input);
	}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Query(() => Products)
	public async getSellerProducts(@Args('input') input: SellerProductsInquiry, @AuthMember('_id') memberId: string): Promise<Products> {
		return this.productService.getSellerProducts(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Products)
	public async getFavorites(@Args('input') input: OrdinaryInquiry, @AuthMember('_id') memberId: string): Promise<Products> {
		return this.productService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Products)
	public async getVisitedProducts(@Args('input') input: OrdinaryInquiry, @AuthMember('_id') memberId: string): Promise<Products> {
		return this.productService.getVisited(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Products)
	public async getAllProductsByAdmin(@Args('input') input: ProductsInquiry): Promise<Products> {
		return this.productService.getAllProductsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async updateProductByAdmin(@Args('input') input: ProductUpdate): Promise<Product> {
		return this.productService.updateProductByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async removeProductByAdmin(@Args('productId') productId: string): Promise<Product> {
		return this.productService.removeProductByAdmin(productId);
	}
}
