import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceReview, ServiceReviews } from '../../libs/dto/service-review/service-review';
import { ServiceReviewInput, ServiceReviewsInquiry } from '../../libs/dto/service-review/service-review.input';
import { ServiceReviewUpdate } from '../../libs/dto/service-review/service-review.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BookingStatus } from '../../libs/enums/service.enum';

@Injectable()
export class ServiceReviewService {
	constructor(
		@InjectModel('ServiceReview') private readonly reviewModel: Model<ServiceReview>,
		@InjectModel('ServiceBooking') private readonly bookingModel: Model<any>,
	) {}

	public async createReview(memberId: string, input: ServiceReviewInput): Promise<ServiceReview> {
		if (!Types.ObjectId.isValid(input.serviceId) || !Types.ObjectId.isValid(input.bookingId)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		const booking = await this.bookingModel.findOne({
			_id: input.bookingId,
			serviceId: input.serviceId,
			$or: [{ customerId: memberId }, { providerId: memberId }],
		}).exec();
		if (!booking) throw new InternalServerErrorException(Message.NOT_ALLOWED_REQUEST);
		if (booking.bookingStatus !== BookingStatus.COMPLETED) {
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		}
		try {
			return await this.reviewModel.create({ ...input, memberId });
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateReview(memberId: string, input: ServiceReviewUpdate): Promise<ServiceReview> {
		const update: Record<string, unknown> = { ...input };
		delete update._id;
		const review = await this.reviewModel.findOneAndUpdate({ _id: input._id, memberId }, update, { new: true }).exec();
		if (!review) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return review;
	}

	public async getServiceReviews(serviceId: string, input: ServiceReviewsInquiry): Promise<ServiceReviews> {
		if (!Types.ObjectId.isValid(serviceId)) throw new BadRequestException(Message.BAD_REQUEST);
		const [result] = await this.reviewModel.aggregate([
			{ $match: { serviceId: new Types.ObjectId(serviceId) } },
			{ $sort: { createdAt: input.direction ?? Direction.DESC } },
			{ $facet: { list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}
}
