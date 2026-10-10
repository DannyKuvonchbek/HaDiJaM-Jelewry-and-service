import { PrivateMediaController } from './sessions/private-media.controller';
import { SessionSchema } from './sessions/session.schema';
import { SessionService } from './sessions/session.service';
import { SessionController } from './sessions/session.controller';
import { OAuthController } from './oauth/oauth.controller';
import { OAuthService } from './oauth/oauth.service';
import { OAuthTicketSchema } from './oauth/oauth-ticket.schema';
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./guards/auth.guard";
import { WithoutGuard } from "./guards/without.guard";
import { RolesGuard } from "./guards/roles.guard";
import AuthRecordSchema from "../../schemas/AuthRecord.model";
import MemberSchema from "../../schemas/Member.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "AuthRecord", schema: AuthRecordSchema },
      { name: "Member", schema: MemberSchema },
      { name: "AuthSession", schema: SessionSchema },
      { name: "OAuthTicket", schema: OAuthTicketSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret=config.getOrThrow<string>('JWT_SECRET');
        if(process.env.NODE_ENV==='production'&&secret.length<32)throw new Error('JWT_SECRET must have at least 32 characters in production.');
        return {secret,signOptions:{expiresIn:240,issuer:'hadijam-api',audience:'hadijam-web',algorithm:'HS256'}};
      },
    }),
  ],
  controllers: [SessionController, PrivateMediaController, OAuthController],
  providers: [SessionService, AuthService, OAuthService, AuthGuard, WithoutGuard, RolesGuard],
  exports: [SessionService, AuthService, AuthGuard, WithoutGuard, RolesGuard],
})
export class AuthModule {}
