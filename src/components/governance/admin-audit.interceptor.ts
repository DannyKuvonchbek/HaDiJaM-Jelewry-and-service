import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { from, lastValueFrom, Observable } from "rxjs";
@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(@InjectModel("AdminAudit") private audits: Model<any>) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<string>() !== "graphql") return next.handle();
    const gql = GqlExecutionContext.create(context);
    const info = gql.getInfo();
    const admin = gql.getContext().req?.authMember;
    const field = info?.fieldName;
    // Existing admin mutations predate governance. Record intent before execution,
    // then the result, without recording credentials or document payloads.
    if (
      admin?.memberType !== "ADMIN" ||
      info?.parentType?.name !== "Mutation" ||
      !(/ByAdmin$/.test(field) || field === "sendProductReviewMessage")
    )
      return next.handle();
    return from(
      (async () => {
        const args = gql.getArgs();
        const entry = await this.audits.create({
          adminId: admin._id,
          action: field,
          targetId: String(
            args.input?._id ||
              args.productId ||
              args.articleId ||
              args.input?.productId ||
              "",
          ),
          outcome: "STARTED",
          details: JSON.stringify({
            fields: Object.keys(args.input || {}).filter(
              (k) => !/password/i.test(k),
            ),
          }),
        });
        try {
          const result = await lastValueFrom(next.handle());
          await this.audits.updateOne(
            { _id: entry._id },
            { $set: { outcome: "SUCCEEDED" } },
          );
          return result;
        } catch (error) {
          await this.audits.updateOne(
            { _id: entry._id },
            { $set: { outcome: "FAILED" } },
          );
          throw error;
        }
      })(),
    );
  }
}
