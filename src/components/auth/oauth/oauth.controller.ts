import { BadRequestException, Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "crypto";
import { OAuthService } from "./oauth.service";
import { OAuthExchangeInput } from "./oauth-exchange.input";
import { SessionService } from "../sessions/session.service";
import { limitAuth, requireBrowserRequest, setRefresh } from "../sessions/auth-security";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

type Provider = "google" | "facebook";
const cookieNames = { state: "hadijam-oauth-state", next: "hadijam-oauth-next", seller: "hadijam-oauth-seller" };
@Controller("auth/oauth")
export class OAuthController {
  constructor(
    private readonly oauth: OAuthService,
    private readonly sessions: SessionService,
    @InjectModel("Member") private readonly members: Model<any>,
  ) {}
  private provider(value: string): Provider {
    if (value !== "google" && value !== "facebook") throw new BadRequestException("Unsupported sign-in provider.");
    return value;
  }
  private cookie(req: Request, key: string) {
    const item = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${key}=`));
    try { return item ? decodeURIComponent(item.slice(key.length + 1)) : ""; } catch { return ""; }
  }
  private setFlowCookie(res: Response, name: string, value: string) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.append("Set-Cookie", `${name}=${encodeURIComponent(value)}; Path=/auth/oauth; HttpOnly; SameSite=Lax; Max-Age=600${secure}`);
  }
  private clearFlowCookies(res: Response) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    for (const name of Object.values(cookieNames)) res.append("Set-Cookie", `${name}=; Path=/auth/oauth; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  }
  private fail(res: Response, reason: string) { return res.redirect(302, `${this.oauth.webOrigin()}/sign-in?oauth_error=${encodeURIComponent(reason)}`); }

  @Get(":provider") begin(@Req() req: Request, @Res() res: Response, @Query("next") next?: string, @Query("seller") seller?: string) {
    const provider = this.provider(String(req.params.provider));
    if (!this.oauth.hasConfig(provider)) return this.fail(res, "provider_not_configured");
    const state = randomBytes(32).toString("base64url");
    this.setFlowCookie(res, cookieNames.state, state);
    this.setFlowCookie(res, cookieNames.next, this.oauth.safeNext(next));
    this.setFlowCookie(res, cookieNames.seller, seller === "1" ? "1" : "0");
    return res.redirect(302, this.oauth.authorizationUrl(provider, state));
  }

  @Get(":provider/callback") async callback(@Req() req: Request, @Res() res: Response, @Query("code") code?: string, @Query("state") state?: string, @Query("error") providerError?: string) {
    const provider = this.provider(String(req.params.provider));
    const expected = this.cookie(req, cookieNames.state);
    this.clearFlowCookies(res);
    if (providerError) return this.fail(res, "provider_cancelled");
    if (!code || !state || !expected) return this.fail(res, "invalid_callback");
    const received = Buffer.from(state), original = Buffer.from(expected);
    if (received.length !== original.length || !timingSafeEqual(received, original)) return this.fail(res, "invalid_state");
    try {
      const sellerIntent = this.cookie(req, cookieNames.seller) === "1";
      const member = await this.oauth.authenticate(provider, code, sellerIntent);
      const ticket = await this.oauth.issueTicket(String(member._id));
      const next = this.oauth.safeNext(this.cookie(req, cookieNames.next));
      return res.redirect(302, `${this.oauth.webOrigin()}/auth/callback?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(next)}`);
    } catch { return this.fail(res, "provider_verification_failed"); }
  }

  @Post("exchange") async exchange(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() input: OAuthExchangeInput) {
    requireBrowserRequest(req);
    limitAuth(req, "oauth-exchange", 10);
    const memberId = await this.oauth.consumeTicket(input.ticket);
    const { refreshToken, expiresAt, accessToken } = await this.sessions.create(memberId);
    setRefresh(res, refreshToken, expiresAt);
    const member: any = await this.members.findById(memberId).lean().exec();
    if (!member) throw new BadRequestException("The account could not be loaded.");
    return { accessToken, member: { _id: String(member._id), memberNick: member.memberNick, memberFullName: member.memberFullName || "", memberType: member.memberType, memberStatus: member.memberStatus, memberImage: member.memberImage || "", memberPhone: member.memberPhone || "", sellerIntent: member.sellerIntent || false } };
  }
}
