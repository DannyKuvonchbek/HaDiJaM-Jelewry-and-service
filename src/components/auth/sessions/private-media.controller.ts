import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import type { Request, Response } from "express";
import { resolve } from "path";
import { SessionService } from "./session.service";
@Controller("private-media")
export class PrivateMediaController {
  constructor(
    private sessions: SessionService,
    @InjectConnection() private connection: Connection,
  ) {}
  @Get(":target/:filename") async view(
    @Param("target") target: string,
    @Param("filename") filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (
      !["atelier", "service-bookings"].includes(target) ||
      !/^([a-f0-9]{24}-)?[a-f0-9-]{36}\.(jpg|jpeg|png|webp|gif|heic|heif)$/.test(
        filename,
      )
    )
      throw new NotFoundException();
    if (!req.headers.authorization?.startsWith("Bearer "))
      throw new UnauthorizedException("Please sign in.");
    const { member } = await this.sessions.authenticate(
      req.headers.authorization.slice(7),
    );
    const id = new Types.ObjectId(String(member._id)),
      path = `uploads/${target}/${filename}`;
    const prefix = filename.match(/^([a-f0-9]{24})-/)?.[1];
    const owner = prefix ? new Types.ObjectId(prefix) : null;
    let allowed =
      member.memberType === "ADMIN" || filename.startsWith(String(id) + "-");
    if (!allowed)
      allowed = Boolean(
        await this.connection
          .collection("atelierChatMessages")
          .findOne({
            attachments: path,
            ...(owner ? { senderId: owner } : {}),
            $or: [{ customerId: id }, { senderId: id }, { recipientId: id }],
          }),
      );
    if (!allowed)
      allowed = Boolean(
        await this.connection
          .collection("serviceBookings")
          .findOne({
            itemPhoto: path,
            ...(owner
              ? { customerId: owner, providerId: id }
              : { $or: [{ customerId: id }, { providerId: id }] }),
          }),
      );
    if (!allowed)
      allowed = Boolean(
        await this.connection
          .collection("serviceRequests")
          .findOne({
            requestImages: path,
            ...(owner
              ? { customerId: owner, providerId: id }
              : { $or: [{ customerId: id }, { providerId: id }] }),
          }),
      );
    if (!allowed && !owner) {
      const records = await this.connection
        .collection("salonReservations")
        .find({
          customerId: id,
          itemManifest: {
            $regex: filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          },
        })
        .limit(100)
        .toArray();
      allowed = records.some((record) => {
        try {
          return JSON.parse(record.itemManifest).referenceFiles?.includes(path);
        } catch {
          return false;
        }
      });
    }
    if (!allowed) throw new NotFoundException();
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    return res.sendFile(resolve(process.cwd(), "uploads", target, filename));
  }
}
