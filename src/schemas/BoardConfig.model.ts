import { Schema } from "mongoose";

const BoardConfigSchema = new Schema(
  {
    bo_id: { type: String, required: true },
    group_id: { type: String, required: true },
    bo_subject: { type: String, required: true },
    bo_page_rows: { type: Number, required: true },
    bo_is_disabled: { type: String, required: true },
    bo_is_admin_only_write: { type: String, required: true },
    bo_is_private: { type: String, required: true },
    bo_is_required_photo: { type: String, required: true },
    bo_counts: { type: Number, required: true },
  },
  { timestamps: true, collection: "boconfigs" },
);

export default BoardConfigSchema;
