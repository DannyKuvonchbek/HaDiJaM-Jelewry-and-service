import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomUUID } from "crypto";
export const normalizeSmsPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s()-]/g, "");
  // Support the Korean domestic form used by existing members. Other ambiguous
  // domestic numbers remain unchanged and are handled only by SMS delivery.
  if (/^010\d{8}$/.test(cleaned)) return `+82${cleaned.slice(1)}`;
  if (/^(8210\d{8}|998\d{9})$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
};
export const smsEnabled = () =>
  process.env.SMS_ENABLED === "true" &&
  !!process.env.SMS_GATEWAY_URL &&
  !!process.env.SMS_GATEWAY_TOKEN;
@Injectable()
export class SmsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private logger = new Logger(SmsService.name);
  constructor(@InjectModel("SmsJob") private jobs: Model<any>) {}
  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), 5000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    if (this.busy || !smsEnabled()) return;
    this.busy = true;
    try {
      const now = new Date();
      const claimToken = randomUUID();
      const job: any = await this.jobs
        .findOneAndUpdate(
          {
            $or: [
              { status: "QUEUED", nextAttemptAt: { $lte: now } },
              { status: "SENDING", leaseUntil: { $lt: now } },
            ],
          },
          {
            $set: {
              status: "SENDING",
              claimToken,
              leaseUntil: new Date(Date.now() + 60000),
            },
            $inc: { attempts: 1 },
          },
          { new: true },
        )
        .lean()
        .exec();
      if (!job) return;
      try {
        if (!/^\+[1-9]\d{7,14}$/.test(job.phone))
          throw new Error("Phone must use international E.164 format.");
        const url = new URL(process.env.SMS_GATEWAY_URL!);
        if (
          url.protocol !== "https:" &&
          !(
            process.env.NODE_ENV !== "production" &&
            ["localhost", "127.0.0.1"].includes(url.hostname)
          )
        )
          throw new Error("SMS gateway requires HTTPS.");
        const response = await fetch(url, {
          method: "POST",
          signal: AbortSignal.timeout(15000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SMS_GATEWAY_TOKEN}`,
            "Idempotency-Key": job.key,
          },
          body: JSON.stringify({
            to: job.phone,
            message: job.message,
            idempotencyKey: job.key,
          }),
        });
        if (!response.ok)
          throw new Error(`SMS gateway HTTP ${response.status}`);
        await this.jobs.updateOne(
          { _id: job._id, claimToken },
          {
            $set: { status: "SENT", sentAt: new Date() },
            $unset: { lastError: 1, leaseUntil: 1, claimToken: 1 },
          },
        );
      } catch (error) {
        const attempts = job.attempts;
        await this.jobs.updateOne(
          { _id: job._id, claimToken },
          {
            $set: {
              status: attempts >= 5 ? "FAILED" : "QUEUED",
              nextAttemptAt: new Date(
                Date.now() + Math.min(3600000, 30000 * 2 ** attempts),
              ),
              lastError:
                error instanceof Error ? error.message : "SMS delivery failed",
            },
            $unset: { leaseUntil: 1, claimToken: 1 },
          },
        );
      }
    } catch {
      this.logger.error("SMS queue processing failed; retrying on next tick.");
    } finally {
      this.busy = false;
    }
  }
}
