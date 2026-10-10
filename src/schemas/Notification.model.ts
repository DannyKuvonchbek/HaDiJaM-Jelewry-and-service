import { Schema } from 'mongoose';

const NotificationSchema = new Schema(
{
	notificationType: { type: String, required: true },
	notificationStatus: { type: String, required: true },
	notificationGroup: { type: String, required: true },
	notificationTitle: { type: String, required: true },
	notificationDesc: { type: String },
	authorId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	receiverId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	productId: { type: Schema.Types.ObjectId, ref: 'Product' },
	serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
	bookingId: { type: Schema.Types.ObjectId, ref: 'ServiceBooking' },
	requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
},
{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ receiverId: 1, createdAt: -1 });
export default NotificationSchema;
