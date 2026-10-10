import { Schema } from 'mongoose';

const ServiceReviewSchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
	bookingId: { type: Schema.Types.ObjectId, required: true, ref: 'ServiceBooking' },
	memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	moderationStatus: { type: String, enum: ['VISIBLE', 'HIDDEN'], default: 'VISIBLE' },
	rating: { type: Number, required: true },
	reviewContent: { type: String, required: true },
	reviewImages: { type: [String], required: true },
},
{ timestamps: true, collection: 'serviceReviews' },
);

ServiceReviewSchema.index({ serviceId: 1, bookingId: 1 }, { unique: true });

export default ServiceReviewSchema;
