import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, Services } from '../../libs/dto/service/service';
import { ServiceInput, ServiceOrdinaryInquiry, ServicesInquiry } from '../../libs/dto/service/service.input';
import { ServiceUpdate } from '../../libs/dto/service/service.update';
import { LikeInput } from '../../libs/dto/like/like.input';
import { ViewInput } from '../../libs/dto/view/view.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeService } from '../likes/like.service';
import { ViewService } from '../views/view.service';
import { ServiceStatus } from '../../libs/enums/service.enum';

@Injectable()
export class ServiceService {
	constructor(
		@InjectModel('Service') private readonly serviceModel: Model<Service>,
		private readonly likeService: LikeService,
		private readonly viewService: ViewService,
	) {}

	public async createService(memberId: string, input: ServiceInput): Promise<Service> {
		try {
			return await this.serviceModel.create({ ...input, memberId });
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getService(serviceId: string, memberId?: string): Promise<Service> {
		if (!Types.ObjectId.isValid(serviceId)) throw new BadRequestException(Message.BAD_REQUEST);
		const service = await this.serviceModel.findOne({ _id: serviceId, serviceStatus: ServiceStatus.ACTIVE }).lean().exec();
		if (!service) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (memberId) {
			const viewInput: ViewInput = { memberId, viewRefId: serviceId, viewGroup: ViewGroup.SERVICE };
			if (await this.viewService.recordView(viewInput)) {
				await this.serviceModel.findByIdAndUpdate(serviceId, { $inc: { serviceViews: 1 } }).exec();
			}
			const likeInput: LikeInput = { memberId, likeRefId: serviceId, likeGroup: LikeGroup.SERVICE };
			(service as Service).meLiked = await this.likeService.checkLikeExistence(likeInput);
		}
		return service as Service;
	}

	public async updateService(memberId: string, input: ServiceUpdate): Promise<Service> {
		if (!Types.ObjectId.isValid(input._id)) throw new BadRequestException(Message.BAD_REQUEST);
		const update: Record<string, unknown> = { ...input };
		delete update._id;
		if (input.serviceStatus !== undefined) {
			const existing = await this.serviceModel.findOne({
				_id: input._id,
				memberId,
				serviceStatus: { $in: [ServiceStatus.DRAFT, ServiceStatus.ACTIVE, ServiceStatus.INACTIVE] },
			}).lean().exec();
			if (!existing) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			const allowed: Record<ServiceStatus, ServiceStatus[]> = {
				[ServiceStatus.DRAFT]: [ServiceStatus.ACTIVE, ServiceStatus.DELETE],
				[ServiceStatus.ACTIVE]: [ServiceStatus.INACTIVE, ServiceStatus.DELETE],
				[ServiceStatus.INACTIVE]: [ServiceStatus.ACTIVE, ServiceStatus.DELETE],
				[ServiceStatus.DELETE]: [],
			};
			if (input.serviceStatus !== existing.serviceStatus && !allowed[existing.serviceStatus].includes(input.serviceStatus)) {
				throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
			}
			if (input.serviceStatus === ServiceStatus.DELETE) update.deletedAt = new Date();
		}
		const service = await this.serviceModel.findOneAndUpdate(
			{ _id: input._id, memberId, serviceStatus: { $in: [ServiceStatus.DRAFT, ServiceStatus.ACTIVE, ServiceStatus.INACTIVE] } }, update, { new: true },
		).exec();
		if (!service) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return service;
	}

	public async getServices(input: ServicesInquiry): Promise<Services> {
		const search = input.search ?? {};
		const match: Record<string, any> = { serviceStatus: ServiceStatus.ACTIVE };
		if (search.serviceType) match.serviceType = search.serviceType;
		if (search.serviceCategory) match.serviceCategory = search.serviceCategory;
		if (search.memberId && Types.ObjectId.isValid(search.memberId)) match.memberId = new Types.ObjectId(search.memberId);
		if (search.text?.trim()) match.serviceTitle = { $regex: search.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
		if (search.minPrice !== undefined || search.maxPrice !== undefined) {
			match.servicePrice = {};
			if (search.minPrice !== undefined) match.servicePrice.$gte = search.minPrice;
			if (search.maxPrice !== undefined) match.servicePrice.$lte = search.maxPrice;
		}
		const [result] = await this.serviceModel.aggregate([
			{ $match: match },
			{ $sort: { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC } },
			{ $facet: {
				list: [
					{ $skip: (input.page - 1) * input.limit },
					{ $limit: input.limit },
					{ $lookup: { from: 'members', localField: 'memberId', foreignField: '_id', as: 'memberData' } },
					{ $unwind: '$memberData' },
				],
				metaCounter: [{ $count: 'total' }],
			} },
		]);
		return result ?? { list: [], metaCounter: [] };
	}

	public async getProviderServices(memberId: string, input: ServiceOrdinaryInquiry): Promise<Services> {
		const [result] = await this.serviceModel.aggregate([
			{ $match: { memberId: new Types.ObjectId(memberId), serviceStatus: { $ne: ServiceStatus.DELETE } } },
			{ $sort: { createdAt: Direction.DESC } },
			{ $facet: { list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}

	public async likeTargetService(memberId: string, serviceId: string): Promise<Service> {
		if (!Types.ObjectId.isValid(serviceId)) throw new BadRequestException(Message.BAD_REQUEST);
		const service = await this.serviceModel.findOne({ _id: serviceId, serviceStatus: ServiceStatus.ACTIVE }).exec();
		if (!service) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const modifier = await this.likeService.toggleLike({ memberId, likeRefId: serviceId, likeGroup: LikeGroup.SERVICE });
		const updated = await this.serviceModel.findByIdAndUpdate(serviceId, { $inc: { serviceLikes: modifier } }, { new: true }).exec();
		if (!updated) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return updated;
	}

	public async getAllServicesByAdmin(input: ServicesInquiry): Promise<Services> {
		const [result] = await this.serviceModel.aggregate([
			{ $sort: { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC } },
			{ $facet: { list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}

	public async updateServiceByAdmin(input: ServiceUpdate): Promise<Service> {
		const update: Record<string, unknown> = { ...input };
		delete update._id;
		if (input.serviceStatus === ServiceStatus.DELETE) update.deletedAt = new Date();
		const service = await this.serviceModel.findByIdAndUpdate(input._id, update, { new: true }).exec();
		if (!service) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return service;
	}
}
