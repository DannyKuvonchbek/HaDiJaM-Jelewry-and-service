import { Schema } from "mongoose";
export const SessionSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, required: true, index: true },
    refreshHash: { type: String, required: true, select: false },
    generation: { type: Number, required: true, default: 0 },
    lastActivityAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "authSessions" },
);
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
