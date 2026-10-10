import { Schema } from "mongoose";
const AIConversationMessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "AIConversation",
    },
    memberId: { type: Schema.Types.ObjectId, required: true, ref: "Member" },
    role: { type: String, required: true, enum: ["USER", "ASSISTANT"] },
    content: { type: String, required: true, maxlength: 6000 },
    locale: { type: String, required: true, enum: ["en", "uz", "ko", "ru"] },
    action: {
      label: { type: String },
      href: { type: String },
    },
  },
  { timestamps: true, collection: "aiConversationMessages" },
);
AIConversationMessageSchema.index({ conversationId: 1, createdAt: 1 });
export default AIConversationMessageSchema;
