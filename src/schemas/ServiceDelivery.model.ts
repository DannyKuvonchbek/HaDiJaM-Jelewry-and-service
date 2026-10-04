import { Schema } from 'mongoose';
import { DeliveryStatus } from '../libs/enums/service.enum';

const ServiceDeliverySchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
	bookingId: { type: Schema.Types.ObjectId, ref: 'ServiceBooking' },
	requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
	memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	deliveryMethod: { type: String, required: true },
	deliveryDirection: { type: String, required: true },
	deliveryStatus: { type: String, enum: DeliveryStatus, default: DeliveryStatus.NEW },
	deliveryAddress: { type: String },
	deliveryPhone: { type: String },
	deliveryNote: { type: String },
	trackingNumber: { type: String },
	courierName: { type: String },
	pickupLocation: { type: String },
	sentAt: { type: Date },
	receivedAt: { type: Date },
	returnedAt: { type: Date },
},
{ timestamps: true, collection: 'serviceDeliveries' },
);

export default ServiceDeliverySchema;
