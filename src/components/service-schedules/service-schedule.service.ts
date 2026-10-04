import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceSchedule, ServiceSchedules } from '../../libs/dto/service-schedule/service-schedule';
import { ServiceScheduleInput } from '../../libs/dto/service-schedule/service-schedule.input';
import { ServiceScheduleUpdate } from '../../libs/dto/service-schedule/service-schedule.update';
import { Direction, Message } from '../../libs/enums/common.enum';

@Injectable()
export class ServiceScheduleService {
	constructor(
		@InjectModel('ServiceSchedule') private readonly scheduleModel: Model<ServiceSchedule>,
		@InjectModel('Service') private readonly serviceModel: Model<any>,
	) {}

	public async createSchedule(providerId: string, input: ServiceScheduleInput): Promise<ServiceSchedule> {
		if (!Types.ObjectId.isValid(input.serviceId)) throw new BadRequestException(Message.BAD_REQUEST);
		const service = await this.serviceModel.exists({ _id: input.serviceId, memberId: providerId });
		if (!service) throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
		try {
			return await this.scheduleModel.create({ ...input, providerId });
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateSchedule(providerId: string, input: ServiceScheduleUpdate): Promise<ServiceSchedule> {
		const update: Record<string, unknown> = { ...input };
		delete update._id;
		const schedule = await this.scheduleModel.findOneAndUpdate({ _id: input._id, providerId }, update, { new: true }).exec();
		if (!schedule) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return schedule;
	}

	public async removeSchedule(providerId: string, scheduleId: string): Promise<ServiceSchedule> {
		const schedule = await this.scheduleModel.findOneAndDelete({ _id: scheduleId, providerId }).exec();
		if (!schedule) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return schedule;
	}

	public async getServiceSchedules(serviceId: string): Promise<ServiceSchedules> {
		if (!Types.ObjectId.isValid(serviceId)) throw new BadRequestException(Message.BAD_REQUEST);
		const [result] = await this.scheduleModel.aggregate([
			{ $match: { serviceId: new Types.ObjectId(serviceId) } },
			{ $sort: { dayOfWeek: Direction.ASC, startTime: Direction.ASC } },
			{ $facet: { list: [{ $skip: 0 }], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}
}
