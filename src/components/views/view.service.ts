import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const exists = await this.viewModel.exists({ memberId: input.memberId, viewRefId: input.viewRefId, viewGroup: input.viewGroup });
		if (exists) return null;
		return this.viewModel.create(input);
	}

	public async getVisitedProducts(memberId: string, page: number, limit: number): Promise<any> {
		const [data] = await this.viewModel.aggregate([
			{ $match: { memberId: new Types.ObjectId(memberId), viewGroup: ViewGroup.PRODUCT } },
			{ $sort: { createdAt: -1 } },
			{ $lookup: { from: 'products', localField: 'viewRefId', foreignField: '_id', as: 'productData' } },
			{ $unwind: '$productData' },
			{ $match: { 'productData.productStatus': 'ACTIVE' } },
			{ $facet: { list: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $replaceRoot: { newRoot: '$productData' } }], metaCounter: [{ $count: 'total' }] } },
		]);
		return data ?? { list: [], metaCounter: [] };
	}
}
