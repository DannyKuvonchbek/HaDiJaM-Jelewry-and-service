import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { AdminPageInput, AdminRecordUpdate } from "./governance.dto";
import { objectId } from "./governance.service";
const configs: Record<
  string,
  { model: string; status?: string; fields: string[] }
> = {
  services: {
    model: "Service",
    status: "serviceStatus",
    fields: [
      "serviceStatus",
      "serviceTitle",
      "serviceCategory",
      "serviceType",
      "servicePrice",
      "serviceDuration",
      "serviceDesc",
    ],
  },
  orders: {
    model: "Order",
    status: "orderStatus",
    fields: ["deliveryAddress", "deliveryPhone", "paymentStatus"],
  },
  orderItems: {
    model: "OrderItem",
    status: "itemStatus",
    fields: ["itemStatus"],
  },
  bookings: {
    model: "ServiceBooking",
    status: "bookingStatus",
    fields: ["bookingStatus", "customerNote"],
  },
  salon: {
    model: "SalonReservation",
    status: "reservationStatus",
    fields: ["reservationStatus"],
  },
  requests: {
    model: "ServiceRequest",
    status: "requestStatus",
    fields: ["requestStatus", "estimatedPrice", "finalPrice", "customerNote"],
  },
  deliveries: {
    model: "ServiceDelivery",
    status: "deliveryStatus",
    fields: ["deliveryStatus", "trackingNumber", "courierName", "deliveryNote"],
  },
  reviews: {
    model: "ServiceReview",
    status: "moderationStatus",
    fields: ["moderationStatus"],
  },
  articles: {
    model: "BoardArticle",
    status: "articleStatus",
    fields: ["articleStatus", "articleTitle", "articleContent"],
  },
  comments: {
    model: "Comment",
    status: "commentStatus",
    fields: ["commentStatus"],
  },
  sms: { model: "SmsJob", status: "status", fields: [] },
  audits: { model: "AdminAudit", fields: [] },
};
export const statusTransitions: Record<string, Record<string, string[]>> = {
  orderItems: {
    REQUESTED: ["CONFIRMED", "REJECTED", "CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["RETURN_REQUESTED"],
    RETURN_REQUESTED: ["RETURNED"],
  },
  bookings: {
    REQUESTED: ["CONFIRMED", "REJECTED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "CANCELLED"],
  },
  salon: { REQUESTED: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["CANCELLED"] },
  requests: {
    NEW: ["REVIEWING", "CANCELLED"],
    REVIEWING: ["QUOTED", "CANCELLED"],
    QUOTED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  },
  deliveries: {
    NEW: ["PREPARING", "CANCELLED"],
    PREPARING: ["SENT", "CANCELLED"],
    SENT: ["RECEIVED", "RETURNED", "CANCELLED"],
    RECEIVED: ["RETURNED"],
  },
};
@Injectable()
export class AdminRecordsService {
  constructor(@InjectConnection() private connection: Connection) {}
  async list(domain: string, input: AdminPageInput) {
    const config = configs[domain];
    if (!config) throw new BadRequestException("Unknown admin domain.");
    const model = this.connection.model(config.model);
    const filter: any = {};
    if (input.status && config.status) filter[config.status] = input.status;
    if (input.search?.trim()) {
      const rx = {
        $regex: input.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
      filter.$or = [
        "serviceTitle",
        "customerName",
        "requestTitle",
        "articleTitle",
        "reviewContent",
        "commentContent",
        "businessName",
        "phone",
        "trackingNumber",
      ]
        .filter((field) => model.schema.path(field))
        .map((field) => ({ [field]: rx }));
      if (!filter.$or.length) delete filter.$or;
    }
    const [records, total] = await Promise.all([
      model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean(),
      model.countDocuments(filter),
    ]);
    return {
      list: records.map((r: any) => ({
        _id: String(r._id),
        data: JSON.stringify(r),
      })),
      total,
    };
  }
  async update(adminId: string, input: AdminRecordUpdate) {
    const config = configs[input.domain];
    if (!config?.fields.length)
      throw new BadRequestException("This domain is read-only.");
    let changes: any;
    try {
      changes = JSON.parse(input.changes);
    } catch {
      throw new BadRequestException("Invalid change payload.");
    }
    if (
      !changes ||
      Array.isArray(changes) ||
      typeof changes !== "object" ||
      !Object.keys(changes).length ||
      Object.keys(changes).some((k) => !config.fields.includes(k))
    )
      throw new BadRequestException("Unsupported update field.");
    for (const [key, value] of Object.entries(changes)) {
      if (/Price$/.test(key)) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
          throw new BadRequestException(
            "Prices must be finite, non-negative numbers.",
          );
      } else if (
        typeof value !== "string" ||
        value.length > 5000 ||
        (!value.trim() &&
          !["customerNote", "deliveryNote", "serviceDesc"].includes(key))
      ) {
        throw new BadRequestException(
          "Provide valid text values for the selected fields.",
        );
      }
    }
    return this.connection.transaction(async (session) => {
      const model = this.connection.model(config.model);
      const current: any = await model
        .findById(objectId(input.id))
        .session(session)
        .lean();
      if (!current) throw new NotFoundException("Record not found.");
      const statusField = config.status;
      const next = statusField && changes[statusField];
      const transitions = statusTransitions[input.domain];
      if (
        next &&
        transitions &&
        next !== current[statusField!] &&
        !transitions[current[statusField!]]?.includes(next)
      )
        throw new BadRequestException("This status transition is not allowed.");
      if (input.domain === "requests") {
        if (
          next === "QUOTED" &&
          changes.estimatedPrice == null &&
          current.estimatedPrice == null
        )
          throw new BadRequestException("A quote requires an estimated price.");
        if (
          changes.estimatedPrice !== undefined &&
          !["NEW", "REVIEWING", "QUOTED"].includes(current.requestStatus)
        )
          throw new BadRequestException(
            "Estimated price can no longer be changed.",
          );
        if (
          changes.finalPrice !== undefined &&
          !["ACCEPTED", "IN_PROGRESS"].includes(current.requestStatus)
        )
          throw new BadRequestException(
            "Final price is not editable in this state.",
          );
      }
      if (input.domain === "services" && next)
        changes.deletedAt = next === "DELETE" ? new Date() : null;
      if (input.domain === "deliveries") {
        if (next === "SENT") changes.sentAt = new Date();
        if (next === "RECEIVED") changes.receivedAt = new Date();
        if (next === "RETURNED") changes.returnedAt = new Date();
      }
      const update: any = { $set: changes };
      if (
        input.domain === "bookings" &&
        ["CANCELLED", "REJECTED"].includes(next)
      )
        update.$unset = { slotKey: 1 };
      const record: any = await model
        .findOneAndUpdate(
          {
            _id: current._id,
            ...(statusField ? { [statusField]: current[statusField] } : {}),
          },
          update,
          { new: true, runValidators: true, session },
        )
        .lean();
      if (!record)
        throw new ConflictException("Record changed. Refresh and retry.");
      if (input.domain === "orderItems") {
        const items: any[] = await this.connection
          .model("OrderItem")
          .find({ orderId: current.orderId })
          .session(session)
          .lean();
        const statuses = items.map((i) => i.itemStatus);
        const cancelled = statuses.every((s) =>
          ["REJECTED", "CANCELLED"].includes(s),
        );
        const complete = statuses.every((s) =>
          [
            "DELIVERED",
            "RETURN_REQUESTED",
            "RETURNED",
            "REJECTED",
            "CANCELLED",
          ].includes(s),
        );
        await this.connection
          .model("Order")
          .updateOne(
            { _id: current.orderId },
            {
              $set: {
                orderStatus: cancelled
                  ? "CANCELLED"
                  : complete
                    ? "COMPLETED"
                    : statuses.every((s) => s === "REQUESTED")
                      ? "NEW"
                      : "CONFIRMED",
              },
            },
            { session },
          );
      }
      await this.connection
        .model("AdminAudit")
        .create(
          [
            {
              adminId,
              action: `UPDATE_${input.domain}`,
              targetId: input.id,
              details: JSON.stringify(changes),
            },
          ],
          { session, ordered: true },
        );
      return { _id: String(record._id), data: JSON.stringify(record) };
    });
  }
}
