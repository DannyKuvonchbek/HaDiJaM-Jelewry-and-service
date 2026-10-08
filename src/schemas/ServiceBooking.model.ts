import { Schema } from 'mongoose';
import { BookingStatus } from '../libs/enums/service.enum';

const ServiceBookingSchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
	serviceTitle: { type: String, default: '' },
	customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	providerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	bookingDate: { type: Date, required: true },
	bookingTime: { type: Date, required: true },
	bookingStatus: { type: String, enum: BookingStatus, default: BookingStatus.REQUESTED },
	bookingPrice: { type: Number, required: true },
	bookingReference: { type: String, required: true },
	selectedTechnician: { type: String, required: true },
	selectedItems: { type: [String], default: [] },
	itemDescription: { type: String, default: '' },
	itemPhoto: { type: String, default: '' },
	paymentStatus: { type: String, default: 'PENDING' },
	slotKey: { type: String },
	customerNote: { type: String },
	customerName: { type: String, required: true },
	customerPhone: { type: String, required: true },
	customerAddress: { type: String, required: true },
},
{ timestamps: true, collection: 'serviceBookings' },
);

ServiceBookingSchema.index(
	{ slotKey: 1 },
	{ unique: true, partialFilterExpression: { slotKey: { $type: 'string' } } },
);
ServiceBookingSchema.index(
	{ bookingReference: 1 },
	{ unique: true, partialFilterExpression: { bookingReference: { $type: 'string' } } },
);

export default ServiceBookingSchema;
