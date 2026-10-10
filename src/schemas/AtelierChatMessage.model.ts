import { Schema } from 'mongoose';

const AtelierChatMessageSchema = new Schema({
	atelier: { type: String, required: true, enum: ['kang-and-sons', 'aurum-gemological-lab', 'milano-heritage-restoration'] },
	customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	senderId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	recipientId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	senderNick: { type: String, required: true },
	senderImage: { type: String },
	messageContent: { type: String, required: true, maxlength: 3000 },
	attachments: { type: [String], default: [] },
}, { timestamps: true, collection: 'atelierChatMessages' });

AtelierChatMessageSchema.index({ atelier: 1, customerId: 1, createdAt: 1 });

export default AtelierChatMessageSchema;
