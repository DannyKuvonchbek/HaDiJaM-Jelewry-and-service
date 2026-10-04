import { Schema } from 'mongoose';
import { OrderItemStatus } from '../libs/enums/order.enum';

const OrderItemSchema = new Schema(
	{
		orderId: { type: Schema.Types.ObjectId, required: true, ref: 'Order', index: true },
		productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
		sellerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		productTitle: { type: String, required: true },
		productType: { type: String, required: true },
		productImages: { type: [String], default: [] },
		unitPrice: { type: Number, required: true },
		quantity: { type: Number, required: true, min: 1 },
		itemPrice: { type: Number, required: true },
		itemStatus: { type: String, enum: OrderItemStatus, default: OrderItemStatus.REQUESTED, required: true },
	},
	{ timestamps: true, collection: 'orderItems' },
);

OrderItemSchema.index({ orderId: 1, productId: 1 }, { unique: true });

export default OrderItemSchema;
