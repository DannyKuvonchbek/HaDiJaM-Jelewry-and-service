import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceSchedule, ServiceSchedules } from '../../libs/dto/service-schedule/service-schedule';
import { ServiceScheduleInput } from '../../libs/dto/service-schedule/service-schedule.input';
import { ServiceScheduleUpdate } from '../../libs/dto/service-schedule/service-schedule.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ServiceScheduleService } from './service-schedule.service';
import { AtelierBusinessHours } from '../../libs/dto/service-schedule/atelier-business-hours';
import { ATELIER_BUSINESS_HOURS } from './atelier-business-hours';

@Resolver()
export class ServiceScheduleResolver {
	constructor(private readonly scheduleService: ServiceScheduleService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceSchedule)
	public async createServiceSchedule(@Args('input') input: ServiceScheduleInput, @AuthMember('_id') providerId: string): Promise<ServiceSchedule> {
		return this.scheduleService.createSchedule(providerId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceSchedule)
	public async updateServiceSchedule(@Args('input') input: ServiceScheduleUpdate, @AuthMember('_id') providerId: string): Promise<ServiceSchedule> {
		return this.scheduleService.updateSchedule(providerId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceSchedule)
	public async removeServiceSchedule(@Args('scheduleId') scheduleId: string, @AuthMember('_id') providerId: string): Promise<ServiceSchedule> {
		return this.scheduleService.removeSchedule(providerId, scheduleId);
	}

	@Query(() => AtelierBusinessHours)
	public getAtelierBusinessHours(): AtelierBusinessHours { return { ...ATELIER_BUSINESS_HOURS, daysOfWeek: [...ATELIER_BUSINESS_HOURS.daysOfWeek] }; }

	@UseGuards(WithoutGuard)
	@Query(() => ServiceSchedules)
	public async getServiceSchedules(@Args('serviceId') serviceId: string): Promise<ServiceSchedules> {
		return this.scheduleService.getServiceSchedules(serviceId);
	}
}
