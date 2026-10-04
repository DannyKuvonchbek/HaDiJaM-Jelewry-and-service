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
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN") ?? "30d",
        },
      }),
    }),
  ],
  providers: [AuthService, AuthGuard, WithoutGuard, RolesGuard],
  exports: [AuthService, AuthGuard, WithoutGuard, RolesGuard],
})
export class AuthModule {}
