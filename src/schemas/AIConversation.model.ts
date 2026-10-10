import { Schema } from "mongoose";
const AIConversationSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Member",
      index: true,
    },
    conversationTitle: { type: String, required: true, maxlength: 120 },
    lastMessageAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "aiConversations" },
);
AIConversationSchema.index({ memberId: 1, lastMessageAt: -1 });
export default AIConversationSchema;
