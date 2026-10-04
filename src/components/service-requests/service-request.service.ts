import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceRequest, ServiceRequests } from '../../libs/dto/service-request/service-request';
import { ServiceRequestInput, ServiceRequestsInquiry } from '../../libs/dto/service-request/service-request.input';
import { ServiceRequestUpdate } from '../../libs/dto/service-request/service-request.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { RequestStatus, ServiceStatus } from '../../libs/enums/service.enum';

@Injectable()
export class ServiceRequestService {
	constructor(
		@InjectModel('ServiceRequest') private readonly requestModel: Model<ServiceRequest>,
		@InjectModel('Service') private readonly serviceModel: Model<any>,
		@InjectModel('ServiceBooking') private readonly bookingModel: Model<any>,
	) {}

	public async createRequest(customerId: string, input: ServiceRequestInput): Promise<ServiceRequest> {
		if (!Types.ObjectId.isValid(input.serviceId)) throw new BadRequestException(Message.BAD_REQUEST);
		const service = await this.serviceModel.findOne({ _id: input.serviceId, serviceStatus: ServiceStatus.ACTIVE }).lean().exec();
		if (!service) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (input.bookingId) {
			if (!Types.ObjectId.isValid(input.bookingId)) throw new BadRequestException(Message.BAD_REQUEST);
			const booking = await this.bookingModel.exists({
				_id: input.bookingId,
				serviceId: input.serviceId,
				customerId,
			});
			if (!booking) throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
		}
		try {
			return await this.requestModel.create({ ...input, customerId, providerId: (service as any).memberId });
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateRequest(memberId: string, input: ServiceRequestUpdate): Promise<ServiceRequest> {
		const request = await this.requestModel.findById(input._id).exec();
		if (!request) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const update: Record<string, unknown> = {};
		if (String(request.customerId) === memberId) {
			if (input.customerNote !== undefined) update.customerNote = input.customerNote;
			if (input.requestStatus !== undefined) {
				const canCancel = ![RequestStatus.COMPLETED, RequestStatus.CANCELLED].includes(request.requestStatus);
				const canAccept = request.requestStatus === RequestStatus.QUOTED && input.requestStatus === RequestStatus.ACCEPTED;
				if (!canAccept && !(canCancel && input.requestStatus === RequestStatus.CANCELLED)) {
					throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
				}
				update.requestStatus = input.requestStatus;
			}
		} else if (String(request.providerId) === memberId) {
			if (input.requestStatus !== undefined) {
				const transitions: Partial<Record<RequestStatus, RequestStatus[]>> = {
					[RequestStatus.NEW]: [RequestStatus.REVIEWING, RequestStatus.CANCELLED],
					[RequestStatus.REVIEWING]: [RequestStatus.QUOTED, RequestStatus.CANCELLED],
					[RequestStatus.ACCEPTED]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
					[RequestStatus.IN_PROGRESS]: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
				};
				if (!transitions[request.requestStatus]?.includes(input.requestStatus)) {
					throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
				}
				if (input.requestStatus === RequestStatus.QUOTED && input.estimatedPrice === undefined && request.estimatedPrice === undefined) {
					throw new BadRequestException(Message.BAD_REQUEST);
				}
				update.requestStatus = input.requestStatus;
			}
			if (input.estimatedPrice !== undefined) {
				if (![RequestStatus.NEW, RequestStatus.REVIEWING, RequestStatus.QUOTED].includes(request.requestStatus)) {
					throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
				}
				update.estimatedPrice = input.estimatedPrice;
			}
			if (input.finalPrice !== undefined) {
				if (![RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS].includes(request.requestStatus)) {
					throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
				}
				update.finalPrice = input.finalPrice;
			}
		} else {
			throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
		}
		if (Object.keys(update).length === 0) throw new BadRequestException(Message.BAD_REQUEST);
		const result = await this.requestModel.findByIdAndUpdate(input._id, update, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getMyRequests(memberId: string, input: ServiceRequestsInquiry): Promise<ServiceRequests> {
		const match: Record<string, unknown> = { $or: [{ customerId: new Types.ObjectId(memberId) }, { providerId: new Types.ObjectId(memberId) }] };
		if (input.requestStatus) match.requestStatus = input.requestStatus;
		const [result] = await this.requestModel.aggregate([
			{ $match: match },
			{ $sort: { createdAt: Direction.DESC } },
			{ $facet: { list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}
}
