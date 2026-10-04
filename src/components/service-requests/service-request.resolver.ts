import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceRequest, ServiceRequests } from '../../libs/dto/service-request/service-request';
import { ServiceRequestInput, ServiceRequestsInquiry } from '../../libs/dto/service-request/service-request.input';
import { ServiceRequestUpdate } from '../../libs/dto/service-request/service-request.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ServiceRequestService } from './service-request.service';

@Resolver()
export class ServiceRequestResolver {
	constructor(private readonly requestService: ServiceRequestService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceRequest)
	public async createServiceRequest(@Args('input') input: ServiceRequestInput, @AuthMember('_id') customerId: string): Promise<ServiceRequest> {
		return this.requestService.createRequest(customerId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceRequest)
	public async updateServiceRequest(@Args('input') input: ServiceRequestUpdate, @AuthMember('_id') memberId: string): Promise<ServiceRequest> {
		return this.requestService.updateRequest(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => ServiceRequests)
	public async getMyServiceRequests(@Args('input') input: ServiceRequestsInquiry, @AuthMember('_id') memberId: string): Promise<ServiceRequests> {
		return this.requestService.getMyRequests(memberId, input);
	}
}
