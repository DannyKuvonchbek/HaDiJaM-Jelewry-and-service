import { Schema } from 'mongoose';
import { BookingStatus } from '../libs/enums/service.enum';

const ServiceBookingSchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
	customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	providerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	bookingDate: { type: Date, required: true },
	bookingTime: { type: Date, required: true },
	bookingStatus: { type: String, enum: BookingStatus, default: BookingStatus.REQUESTED },
	bookingPrice: { type: Number, required: true },
	customerNote: { type: String },
	customerPhone: { type: String, required: true },
	customerAddress: { type: String, required: true },
},
{ timestamps: true, collection: 'serviceBookings' },
);

export default ServiceBookingSchema;
