import { Schema } from 'mongoose';
import { RequestStatus } from '../libs/enums/service.enum';

const ServiceRequestSchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
	bookingId: { type: Schema.Types.ObjectId, ref: 'ServiceBooking' },
	customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	providerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	requestTitle: { type: String, required: true },
	requestDesc: { type: String, required: true },
	requestImages: { type: [String], required: true },
	requestStatus: { type: String, enum: RequestStatus, default: RequestStatus.NEW },
	estimatedPrice: { type: Number },
	finalPrice: { type: Number },
	customerNote: { type: String },
},
{ timestamps: true, collection: 'serviceRequests' },
);

export default ServiceRequestSchema;
