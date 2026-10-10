import { Schema } from "mongoose";
const AIProductReviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
      unique: true,
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, required: true, ref: "Member" },
    riskLevel: {
      type: String,
      required: true,
      enum: ["LOW", "REVIEW", "HIGH"],
    },
    findings: { type: [String], required: true, default: [] },
    analysisSummary: { type: String, required: true, maxlength: 2000 },
    sellerMessageDraft: { type: String, required: true, maxlength: 3000 },
    provider: { type: String, required: true },
    model: { type: String, required: true },
  },
  { timestamps: true, collection: "aiProductReviews" },
);
export default AIProductReviewSchema;
