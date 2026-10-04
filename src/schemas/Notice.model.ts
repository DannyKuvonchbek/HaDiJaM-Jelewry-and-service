import { Schema } from 'mongoose';

const NoticeSchema = new Schema(
{
	noticeCategory: { type: String, required: true },
	noticeStatus: { type: String, required: true },
	noticeTitle: { type: String, required: true },
	noticeContent: { type: String, required: true },
	memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
},
{ timestamps: true, collection: 'notices' },
);

export default NoticeSchema;
