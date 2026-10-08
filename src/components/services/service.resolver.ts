import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Service, Services } from '../../libs/dto/service/service';
import { ServiceInput, ServiceOrdinaryInquiry, ServicesInquiry } from '../../libs/dto/service/service.input';
import { ServiceUpdate } from '../../libs/dto/service/service.update';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ServiceService } from './service.service';

@Resolver()
export class ServiceResolver {
	constructor(private readonly serviceService: ServiceService) {}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async createService(@Args('input') input: ServiceInput, @AuthMember('_id') memberId: string): Promise<Service> {
		return this.serviceService.createService(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Service)
	public async getService(@Args('serviceId') serviceId: string, @AuthMember('_id') memberId: string): Promise<Service> {
		return this.serviceService.getService(serviceId, memberId);
	}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async updateService(@Args('input') input: ServiceUpdate, @AuthMember('_id') memberId: string): Promise<Service> {
		return this.serviceService.updateService(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Services)
	public async getServices(@Args('input') input: ServicesInquiry, @AuthMember('_id') memberId?: string): Promise<Services> {
		return this.serviceService.getServices(input, memberId);
	}

	@Roles(MemberType.SELLER)
	@UseGuards(RolesGuard)
	@Query(() => Services)
	public async getProviderServices(@Args('input') input: ServiceOrdinaryInquiry, @AuthMember('_id') memberId: string): Promise<Services> {
		return this.serviceService.getProviderServices(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Service)
	public async likeTargetService(@Args('serviceId') serviceId: string, @AuthMember('_id') memberId: string): Promise<Service> {
		return this.serviceService.likeTargetService(memberId, serviceId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Services)
	public async getAllServicesByAdmin(@Args('input') input: ServicesInquiry): Promise<Services> {
		return this.serviceService.getAllServicesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Service)
	public async updateServiceByAdmin(@Args('input') input: ServiceUpdate): Promise<Service> {
		return this.serviceService.updateServiceByAdmin(input);
	}
}
