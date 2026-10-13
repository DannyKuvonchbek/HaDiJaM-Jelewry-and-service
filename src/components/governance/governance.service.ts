import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import {
  AdminPageInput,
  SellerApplicationInput,
  SellerReviewInput,
} from "./governance.dto";
import { smsEnabled, normalizeSmsPhone } from "./sms.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
export const SELLER_PENDING_MESSAGE =
  "Please wait. Your seller application is being reviewed by our administrator. We will notify you as soon as a decision is made.";
export const SELLER_APPROVED_MESSAGE =
  "Your seller documents have been successfully approved. Welcome to HaDiJaM! We are delighted to work with you.";
export const objectId = (id: string) => {
  if (!Types.ObjectId.isValid(id))
    throw new BadRequestException("Invalid identifier.");
  return new Types.ObjectId(id);
};
@Injectable()
export class GovernanceService implements OnModuleInit, OnModuleDestroy {
  private approvalTimer?: ReturnType<typeof setInterval>;
  private approving = false;
  private readonly logger = new Logger(GovernanceService.name);
  constructor(
    @InjectConnection() readonly connection: Connection,
    @InjectModel("SellerApplication") readonly applications: Model<any>,
    @InjectModel("PrivateDocument") readonly documents: Model<any>,
    @InjectModel("Member") readonly members: Model<any>,
    @InjectModel("Notification") readonly notifications: Model<any>,
    private readonly notificationGateway: NotificationsGateway,
    @InjectModel("SmsJob") readonly sms: Model<any>,
    @InjectModel("AdminAudit") readonly audits: Model<any>,
  ) {}
  async onModuleInit() {
    // Do not accept approval requests before uniqueness constraints are ready.
    await Promise.all(
      [
        this.applications,
        this.documents,
        this.sms,
        this.audits,
        this.notifications,
      ].map((model) => model.init()),
    );
    await this.applications.updateMany(
      { status: "PENDING", autoApproveAt: { $exists: false } },
      { $set: { autoApproveAt: new Date(Date.now() + 5000) } },
    );
    this.approvalTimer = setInterval(
      () => void this.approveDueApplications(),
      500,
    );
    this.approvalTimer.unref();
  }
  onModuleDestroy() {
    if (this.approvalTimer) clearInterval(this.approvalTimer);
  }
  private async approveDueApplications() {
    if (this.approving) return;
    this.approving = true;
    try {
      const due = await this.applications
        .find({ status: "PENDING", autoApproveAt: { $lte: new Date() } })
        .limit(100)
        .lean();
      for (const application of due) {
        try {
          await this.review(
            String(application.memberId),
            {
              applicationId: String(application._id),
              revision: application.revision,
              decision: "APPROVED",
            },
            true,
          );
        } catch (error) {
          if (!(error instanceof ConflictException))
            this.logger.error(
              "Automatic seller approval failed; it will be retried.",
            );
        }
      }
    } catch {
      this.logger.error("Could not load automatic seller approvals; retrying.");
    } finally {
      this.approving = false;
    }
  }
  async submit(memberId: string, input: SellerApplicationInput) {
    const member: any = await this.members.findById(memberId).lean();
    if (
      !member ||
      member.memberType !== "USER" ||
      member.memberStatus !== "ACTIVE"
    )
      throw new ForbiddenException("Only active user accounts can apply.");
    if (!input.businessName.trim() || !input.businessAddress.trim())
      throw new BadRequestException("Provide your business name and address.");
    if (
      input.idDocumentId &&
      input.businessDocumentId &&
      input.idDocumentId === input.businessDocumentId
    )
      throw new BadRequestException(
        "Choose separate ID and business documents.",
      );
    const suppliedIds = [input.idDocumentId, input.businessDocumentId]
      .filter(Boolean)
      .map((id) => objectId(id!));
    if (
      suppliedIds.length &&
      (await this.documents.countDocuments({
        _id: { $in: suppliedIds },
        memberId: objectId(memberId),
      })) !== suppliedIds.length
    )
      throw new BadRequestException("Documents must belong to your account.");
    // A single transaction reserves the unique member application and publishes inbox entries.
    try {
      return await this.connection.transaction(async (session) => {
        const current: any = await this.applications
          .findOne({ memberId })
          .session(session);
        if (current?.status === "APPROVED")
          throw new ConflictException("This account is already approved.");
        if (current?.status === "PENDING") return current;
        const values = {
          businessName: input.businessName.trim(),
          businessAddress: input.businessAddress.trim(),
          idDocumentId: input.idDocumentId
            ? objectId(input.idDocumentId)
            : null,
          businessDocumentId: input.businessDocumentId
            ? objectId(input.businessDocumentId)
            : null,
          status: "PENDING",
          autoApproveAt: new Date(Date.now() + 5000),
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
        };
        let application: any;
        if (current) {
          application = await this.applications.findOneAndUpdate(
            { _id: current._id, status: "REJECTED" },
            { $set: values, $inc: { revision: 1 } },
            { new: true, session },
          );
          if (!application)
            throw new ConflictException(
              "Application changed. Refresh and try again.",
            );
        } else {
          [application] = await this.applications.create(
            [{ ...values, memberId, revision: 1 }],
            { session, ordered: true },
          );
        }
        const admins: any[] = await this.members
          .find({ memberType: "ADMIN", memberStatus: "ACTIVE" })
          .select("_id")
          .session(session)
          .lean();
        const base = {
          notificationType: "MESSAGE",
          notificationStatus: "UNREAD",
          notificationGroup: "SELLER_APPLICATION",
          authorId: memberId,
        };
        await this.notifications.create(
          [
            {
              ...base,
              receiverId: memberId,
              notificationTitle: "Seller application under review",
              notificationDesc: SELLER_PENDING_MESSAGE,
            },
            ...admins.map((admin) => ({
              ...base,
              receiverId: admin._id,
              notificationTitle: "New seller application",
              notificationDesc: `${member.memberNick} submitted seller documents. Open Seller Applications to review.`,
            })),
          ],
          { session, ordered: true },
        );
        return application;
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existing: any = await this.applications
          .findOne({ memberId })
          .lean();
        if (existing?.status === "PENDING") return existing;
      }
      throw error;
    }
  }
  async review(adminId: string, input: SellerReviewInput, automatic = false) {
    if (
      input.decision === "REJECTED" &&
      (!input.reason || input.reason.trim().length < 5)
    )
      throw new BadRequestException(
        "Please enter a rejection reason (at least 5 characters).",
      );
    let notificationToPublish: any;
    const result = await this.connection.transaction(async (session) => {
      const current: any = await this.applications
        .findById(objectId(input.applicationId))
        .session(session);
      if (!current) throw new NotFoundException("Application not found.");
      if (
        automatic &&
        (!current.autoApproveAt ||
          current.autoApproveAt > new Date() ||
          input.decision !== "APPROVED")
      )
        throw new ConflictException("Automatic approval is not due yet.");
      if (current.revision !== input.revision)
        throw new ConflictException(
          "A newer application revision exists. Refresh before reviewing.",
        );
      if (current.status === input.decision) return current;
      if (current.status !== "PENDING")
        throw new ConflictException(
          "This application has already been reviewed.",
        );
      const application: any = await this.applications.findOneAndUpdate(
        { _id: current._id, revision: input.revision, status: "PENDING" },
        {
          $set: {
            status: input.decision,
            reviewedBy: automatic ? null : adminId,
            reviewedAt: new Date(),
            rejectionReason:
              input.decision === "REJECTED" ? input.reason!.trim() : null,
          },
        },
        { new: true, session },
      );
      if (!application)
        throw new ConflictException(
          "Another administrator reviewed this application.",
        );
      const member: any = await this.members
        .findOne({
          _id: current.memberId,
          memberType: "USER",
          memberStatus: "ACTIVE",
        })
        .session(session);
      if (!member)
        throw new ConflictException(
          "The applicant is no longer an active user.",
        );
      const approved = input.decision === "APPROVED";
      if (approved)
        await this.members.updateOne(
          { _id: member._id, memberType: "USER", memberStatus: "ACTIVE" },
          { $set: { memberType: "SELLER", sellerApprovedAt: new Date() } },
          { session },
        );
      const message = approved
        ? SELLER_APPROVED_MESSAGE
        : `Your seller application was not approved. Reason: ${input.reason!.trim()} Please update your documents and resubmit your application.`;
      const createdNotifications = await this.notifications.create(
        [
          {
            notificationType: "MESSAGE",
            notificationStatus: "UNREAD",
            notificationGroup: "SELLER_APPLICATION",
            notificationTitle: approved
              ? "Seller application approved"
              : "Seller application requires changes",
            notificationDesc: message,
            authorId: adminId,
            receiverId: member._id,
          },
        ],
        { session, ordered: true },
      );
      notificationToPublish = createdNotifications[0];
      if (approved)
        await this.sms.create(
          [
            {
              key: `seller-approved:${application._id}:${application.revision}`,
              receiverId: member._id,
              phone: normalizeSmsPhone(member.memberPhone),
              message,
              status: smsEnabled() ? "QUEUED" : "DISABLED",
              nextAttemptAt: new Date(),
            },
          ],
          { session, ordered: true },
        );
      await this.audits.create(
        [
          {
            adminId: automatic ? undefined : adminId,
            actorType: automatic ? "SYSTEM" : "ADMIN",
            action: automatic
              ? "SELLER_AUTO_APPROVED"
              : `SELLER_${input.decision}`,
            targetId: String(application._id),
            details: JSON.stringify({
              revision: application.revision,
              reason: application.rejectionReason,
            }),
          },
        ],
        { session, ordered: true },
      );
      return application;
    });
    if (notificationToPublish) await this.notificationGateway.emitMember(String(notificationToPublish.receiverId), notificationToPublish);
    return result;
  }
  async mine(memberId: string) {
    return this.applications.findOne({ memberId }).lean();
  }
  async list(input: AdminPageInput) {
    const filter: any = {};
    if (input.status) {
      if (!["PENDING", "APPROVED", "REJECTED"].includes(input.status))
        throw new BadRequestException("Invalid application status.");
      filter.status = input.status;
    }
    if (input.search?.trim())
      filter.businessName = {
        $regex: input.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    const [list, total, pendingCount] = await Promise.all([
      this.applications
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean(),
      this.applications.countDocuments(filter),
      this.applications.countDocuments({ status: "PENDING" }),
    ]);
    const members: any[] = await this.members
      .find({ _id: { $in: list.map((a: any) => a.memberId) } })
      .select("memberNick memberPhone")
      .lean();
    return {
      list: list.map((a: any) => {
        const member = members.find(
          (m) => String(m._id) === String(a.memberId),
        );
        return {
          ...a,
          memberNick: member?.memberNick,
          memberPhone: member?.memberPhone,
        };
      }),
      total,
      pendingCount,
    };
  }
  async releaseSms(adminId: string, id: string) {
    if (!smsEnabled())
      throw new BadRequestException(
        "Configure and enable the SMS gateway first.",
      );
    return this.connection.transaction(async (session) => {
      const result = await this.sms.updateOne(
        { _id: objectId(id), status: { $in: ["DISABLED", "FAILED"] } },
        {
          $set: { status: "QUEUED", attempts: 0, nextAttemptAt: new Date() },
          $unset: { lastError: 1 },
        },
        { session },
      );
      if (!result.modifiedCount)
        throw new ConflictException(
          "Only disabled or failed SMS jobs can be queued manually.",
        );
      await this.audits.create(
        [{ adminId, action: "SMS_REQUEUE", targetId: id }],
        { session, ordered: true },
      );
      return true;
    });
  }
}
