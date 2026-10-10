import { Schema } from "mongoose";
const oid = Schema.Types.ObjectId;
export const SellerApplicationSchema = new Schema(
  {
    memberId: { type: oid, required: true, unique: true, ref: "Member" },
    businessName: { type: String, required: true },
    businessAddress: { type: String, required: true },
    idDocumentId: { type: oid, required: true },
    businessDocumentId: { type: oid, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    revision: { type: Number, default: 1 },
    reviewedBy: { type: oid },
    reviewedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true, collection: "sellerApplications" },
);
export const PrivateDocumentSchema = new Schema(
  {
    memberId: { type: oid, required: true, index: true },
    filename: String,
    mime: String,
    storageName: { type: String, required: true },
    size: Number,
  },
  { timestamps: true, collection: "privateDocuments" },
);
export const SmsJobSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    receiverId: { type: oid, required: true },
    phone: String,
    message: String,
    status: {
      type: String,
      enum: ["DISABLED", "QUEUED", "SENDING", "SENT", "FAILED"],
      index: true,
    },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: Date,
    leaseUntil: Date,
    claimToken: String,
    lastError: String,
    sentAt: Date,
  },
  { timestamps: true, collection: "smsJobs" },
);
export const AuditSchema = new Schema(
  {
    adminId: { type: oid, required: true },
    action: String,
    targetId: String,
    outcome: { type: String, default: "SUCCEEDED" },
    details: String,
  },
  { timestamps: true, collection: "adminAudits" },
);
