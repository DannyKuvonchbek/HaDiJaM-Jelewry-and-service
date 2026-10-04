import { Schema } from 'mongoose';

const ServiceScheduleSchema = new Schema(
{
	serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
	providerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	dayOfWeek: { type: String, required: true },
	isWorking: { type: Boolean, required: true },
	startTime: { type: String, required: true },
	endTime: { type: String, required: true },
	breakStartTime: { type: String },
	breakEndTime: { type: String },
},
	{ timestamps: { createdAt: true, updatedAt: false }, collection: 'serviceSchedules' },
);

export default ServiceScheduleSchema;
