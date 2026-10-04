import { Schema } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../libs/enums/order.enum';

const OrderSchema = new Schema(
{
	memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
	orderStatus: { type: String, enum: OrderStatus, default: OrderStatus.NEW, required: true },
	orderPrice: { type: Number, required: true },
	deliveryAddress: { type: String, required: true },
	deliveryPhone: { type: String, required: true },
	paymentMethod: { type: String, enum: PaymentMethod, required: true },
	paymentStatus: { type: String, enum: PaymentStatus, default: PaymentStatus.PENDING, required: true },
},
{ timestamps: true, collection: 'orders' },
);

export default OrderSchema;
