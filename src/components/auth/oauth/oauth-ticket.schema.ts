import { Schema } from "mongoose";

export const OAuthTicketSchema = new Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: Schema.Types.ObjectId, required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { collection: "oauth_tickets", versionKey: false },
);
