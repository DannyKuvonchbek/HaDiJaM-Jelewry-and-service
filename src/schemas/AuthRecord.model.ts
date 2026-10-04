import { Schema } from "mongoose";

const AuthRecordSchema = new Schema(
  {
    auth_phone: { type: String, required: true },
    auth_code: { type: String, required: true, select: false },
    auth_ip: { type: String, required: true },
    auth_status: { type: String, required: true },
    eskiz_id: { type: Number, required: true },
  },
  { timestamps: true, collection: "auths" },
);

export default AuthRecordSchema;
