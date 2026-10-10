import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash, randomBytes } from "crypto";
import { Model } from "mongoose";
import { MemberAuthType, MemberStatus, MemberType } from "../../../libs/enums/member.enum";

type Provider = "google" | "facebook";
type OAuthProfile = { id: string; name: string; email?: string; image?: string };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

@Injectable()
export class OAuthService {
  constructor(
    @InjectModel("Member") private readonly members: Model<any>,
    @InjectModel("OAuthTicket") private readonly tickets: Model<any>,
  ) {}

  private config(provider: Provider) {
    if (provider === "google") return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${this.apiOrigin()}/auth/oauth/google/callback`,
    };
    return {
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${this.apiOrigin()}/auth/oauth/facebook/callback`,
    };
  }

  apiOrigin() { return (process.env.PUBLIC_API_ORIGIN || (process.env.NODE_ENV === "production" ? "https://hadijam.com" : "http://localhost:2002")).replace(/\/$/, ""); }
  webOrigin() { return (process.env.PUBLIC_WEB_ORIGIN || (process.env.NODE_ENV === "production" ? "https://www.hadijam.com" : "http://localhost:3017")).replace(/\/$/, ""); }
  safeNext(value?: string) { return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/"; }
  hasConfig(provider: Provider) { const config = this.config(provider); return Boolean(config.clientId && config.clientSecret); }

  authorizationUrl(provider: Provider, state: string) {
    const config = this.config(provider);
    if (!config.clientId || !config.clientSecret) throw new ServiceUnavailableException("OAuth provider is not configured.");
    const endpoint = provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : `https://www.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || "v23.0"}/dialog/oauth`;
    const url = new URL(endpoint);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    if (provider === "google") {
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("include_granted_scopes", "true");
    } else {
      url.searchParams.set("scope", "public_profile,email");
    }
    return url.toString();
  }

  async authenticate(provider: Provider, code: string, sellerIntent = false): Promise<any> {
    const config = this.config(provider);
    if (!config.clientId || !config.clientSecret) throw new ServiceUnavailableException("OAuth provider is not configured.");
    const profile = provider === "google"
      ? await this.googleProfile(code, config)
      : await this.facebookProfile(code, config);
    return this.findOrCreateMember(provider, profile, sellerIntent);
  }

  private async googleProfile(code: string, config: { clientId?: string; clientSecret?: string; redirectUri: string }): Promise<OAuthProfile> {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: config.clientId!, client_secret: config.clientSecret!, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
    });
    const token = await tokenResponse.json() as any;
    if (!tokenResponse.ok || !token.access_token) throw new BadRequestException("Google sign-in could not be verified.");
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const data = await response.json() as any;
    if (!response.ok || !data.sub || data.email_verified !== true) throw new BadRequestException("Google did not return a verified account.");
    return { id: String(data.sub), name: String(data.name || data.email || "HaDiJaM Client"), email: data.email ? String(data.email).toLowerCase() : undefined, image: typeof data.picture === "string" ? data.picture : undefined };
  }

  private async facebookProfile(code: string, config: { clientId?: string; clientSecret?: string; redirectUri: string }): Promise<OAuthProfile> {
    const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v23.0";
    const tokenUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
    tokenUrl.search = new URLSearchParams({ client_id: config.clientId!, client_secret: config.clientSecret!, redirect_uri: config.redirectUri, code }).toString();
    const tokenResponse = await fetch(tokenUrl);
    const token = await tokenResponse.json() as any;
    if (!tokenResponse.ok || !token.access_token) throw new BadRequestException("Facebook sign-in could not be verified.");
    const profileUrl = new URL(`https://graph.facebook.com/${graphVersion}/me`);
    profileUrl.search = new URLSearchParams({ fields: "id,name,email,picture.type(large)", access_token: token.access_token }).toString();
    const response = await fetch(profileUrl);
    const data = await response.json() as any;
    if (!response.ok || !data.id) throw new BadRequestException("Facebook did not return a valid account.");
    return { id: String(data.id), name: String(data.name || "HaDiJaM Client"), email: data.email ? String(data.email).toLowerCase() : undefined, image: data.picture?.data?.url };
  }

  private async findOrCreateMember(provider: Provider, profile: OAuthProfile, sellerIntent: boolean) {
    const providerField = provider === "google" ? "oauthGoogleId" : "oauthFacebookId";
    const providerType = provider === "google" ? MemberAuthType.GOOGLE : MemberAuthType.FACEBOOK;
    let member = await this.members.findOne({ [providerField]: profile.id }).exec();
    if (!member) {
      const base = (profile.email?.split("@")[0] || profile.name).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 72) || "collector";
      let memberNick = "";
      for (let attempt = 0; attempt < 8; attempt++) {
        memberNick = `${base}.${randomBytes(3).toString("hex")}`.slice(0, 100);
        if (!(await this.members.exists({ memberNick }))) break;
        memberNick = "";
      }
      if (!memberNick) throw new ServiceUnavailableException("Could not create a unique account name.");
      try {
        member = await this.members.create({
          memberNick, memberFullName: profile.name.slice(0, 100), memberEmail: profile.email,
          memberImage: "", [providerField]: profile.id,
          memberType: MemberType.USER, sellerIntent, memberStatus: MemberStatus.ACTIVE, memberAuthType: providerType,
        });
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          member = await this.members.findOne({ [providerField]: profile.id }).exec();
          if (!member) throw new BadRequestException("This social account is already connected to another profile.");
        } else throw error;
      }
    }
    if (member.memberStatus !== MemberStatus.ACTIVE) throw new BadRequestException("This HaDiJaM account is not active.");
    return member;
  }

  async issueTicket(memberId: string) {
    const ticket = randomBytes(32).toString("base64url");
    await this.tickets.create({ _id: hash(ticket), memberId, expiresAt: new Date(Date.now() + 90_000) });
    return ticket;
  }

  async consumeTicket(ticket: string) {
    const record: any = await this.tickets.findOneAndDelete({ _id: hash(ticket), expiresAt: { $gt: new Date() } }).lean().exec();
    if (!record) throw new BadRequestException("Sign-in link expired. Please try again.");
    return String(record.memberId);
  }
}
