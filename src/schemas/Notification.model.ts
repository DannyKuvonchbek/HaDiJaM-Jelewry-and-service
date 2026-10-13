import { Schema } from 'mongoose';

const NotificationSchema = new Schema(
{
	notificationType: { type: String, required: true },
	notificationStatus: { type: String, required: true },
	notificationGroup: { type: String, required: true },
	notificationTitle: { type: String, required: true },
	notificationDesc: { type: String },
	authorId: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
	receiverId: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
	isGlobal: { type: Boolean, default: false },
	dedupeKey: { type: String },
	readBy: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
	productId: { type: Schema.Types.ObjectId, ref: 'Product' },
	serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
	bookingId: { type: Schema.Types.ObjectId, ref: 'ServiceBooking' },
	requestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
},
{ timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ receiverId: 1, createdAt: -1 });
NotificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
export default NotificationSchema;
