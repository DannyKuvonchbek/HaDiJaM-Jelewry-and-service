import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { SessionService } from "./session.service";
import {
  clearRefresh,
  limitAuth,
  readRefresh,
  requireBrowserRequest,
  setRefresh,
} from "./auth-security";
const publicMember = (member: any) => ({
  _id: String(member._id),
  memberNick: member.memberNick,
  memberType: member.memberType,
  memberStatus: member.memberStatus,
  memberImage: member.memberImage ?? "",
  sellerIntent: member.sellerIntent ?? false,
});
@Controller("auth")
export class SessionController {
  constructor(private sessions: SessionService) {}
  private token(req: Request) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw new UnauthorizedException("Please sign in.");
    return header.slice(7);
  }
  @Get("session") async current(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader("Cache-Control", "no-store");
    const { member, session } = await this.sessions.authenticate(
      this.token(req),
    );
    return { member: publicMember(member), expiresAt: session.expiresAt };
  }
  @Post("refresh") async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    requireBrowserRequest(req);
    limitAuth(req, "refresh", 60);
    try {
      const result = await this.sessions.refresh(readRefresh(req));
      setRefresh(res, result.refreshToken, result.expiresAt);
      return {
        accessToken: result.accessToken,
        member: publicMember(result.member),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) clearRefresh(res);
      throw error;
    }
  }
  @Post("activity") async activity(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    requireBrowserRequest(req);
    limitAuth(req, "activity", 120);
    const result = await this.sessions.activity(
      this.token(req),
      readRefresh(req),
    );
    setRefresh(res, result.refreshToken, result.expiresAt);
    return { expiresAt: result.expiresAt };
  }
  @Post("logout") async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    requireBrowserRequest(req);
    try {
      await this.sessions.logout(readRefresh(req));
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
    }
    clearRefresh(res);
    return { success: true };
  }
  @Post("logout-all") async logoutAll(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    requireBrowserRequest(req);
    const { member } = await this.sessions.authenticate(this.token(req));
    await this.sessions.revokeMember(String(member._id));
    clearRefresh(res);
    return { success: true };
  }
}
