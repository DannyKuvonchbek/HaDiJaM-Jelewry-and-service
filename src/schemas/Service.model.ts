import { Schema } from 'mongoose';
import { ServiceStatus } from '../libs/enums/service.enum';

const ServiceSchema = new Schema(
{
	serviceType: { type: String, required: true },
	serviceStatus: { type: String, enum: ServiceStatus, default: ServiceStatus.DRAFT },
	serviceTitle: { type: String, required: true },
	serviceCategory: { type: String, required: true },
	servicePrice: { type: Number, required: true },
	serviceDuration: { type: String, required: true },
	serviceImages: { type: [String], required: true },
	serviceDesc: { type: String },
	serviceViews: { type: Number, default: 0 },
	serviceLikes: { type: Number, default: 0 },
	serviceComments: { type: Number, default: 0 },
	serviceRank: { type: Number, default: 0 },
	memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	deletedAt: { type: Date },
},
{ timestamps: true, collection: 'services' },
);

export default ServiceSchema;
