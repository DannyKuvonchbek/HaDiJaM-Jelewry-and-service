import { Schema } from 'mongoose';

const ServiceReviewSchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
	bookingId: { type: Schema.Types.ObjectId, required: true, ref: 'ServiceBooking' },
	memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	rating: { type: Number, required: true },
	reviewContent: { type: String, required: true },
	reviewImages: { type: [String], required: true },
},
{ timestamps: true, collection: 'serviceReviews' },
);

export default ServiceReviewSchema;
