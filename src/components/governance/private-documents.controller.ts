import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthService } from "../auth/auth.service";
import { GovernanceService, objectId } from "./governance.service";
import { mkdir, writeFile, unlink } from "fs/promises";
import { resolve, sep } from "path";
import { randomUUID } from "crypto";
const root = () => {
  const value = resolve(
    process.env.PRIVATE_DOCUMENT_DIR ||
      resolve(process.cwd(), "private-documents"),
  );
  const publicRoot = resolve(process.cwd(), "uploads");
  if (value === publicRoot || value.startsWith(publicRoot + sep))
    throw new Error("Private documents must be stored outside public uploads.");
  return value;
};
// Authenticate before accepting the body; do not expose these files through static serving.
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UseGuards,
} from "@nestjs/common";
@Injectable()
export class DocumentAuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw new UnauthorizedException("Please sign in.");
    try {
      req.authMember = await this.auth.getAuthenticatedMember(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException(
        "Your session has expired. Please sign in again.",
      );
    }
  }
}
@Controller("seller-documents")
@UseGuards(DocumentAuthGuard)
export class PrivateDocumentsController {
  constructor(private governance: GovernanceService) {}
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) =>
        cb(
          ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)
            ? null
            : new BadRequestException(
                "Only PDF, JPEG and PNG documents are allowed.",
              ),
          ["application/pdf", "image/jpeg", "image/png"].includes(
            file.mimetype,
          ),
        ),
    }),
  )
  async upload(@Req() req: any, @UploadedFile() file: any) {
    if (!file?.buffer?.length)
      throw new BadRequestException("Choose a document.");
    const bytes: Buffer = file.buffer;
    const actualMime =
      bytes.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : bytes.length >= 8 &&
            bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : bytes.length >= 3 &&
              bytes[0] === 255 &&
              bytes[1] === 216 &&
              bytes[2] === 255
            ? "image/jpeg"
            : null;
    if (actualMime !== file.mimetype)
      throw new BadRequestException(
        "The file contents do not match a supported document format.",
      );
    const storageName = randomUUID();
    const filename = resolve(root(), storageName);
    await mkdir(root(), { recursive: true, mode: 0o700 });
    await writeFile(filename, bytes, { flag: "wx", mode: 0o600 });
    try {
      const doc = await this.governance.documents.create({
        memberId: req.authMember._id,
        filename: file.originalname.slice(0, 200),
        mime: actualMime,
        storageName,
        size: file.size,
      });
      return { documentId: String(doc._id) };
    } catch (error) {
      await unlink(filename).catch(() => undefined);
      throw error;
    }
  }
  @Get()
  async listMine(@Req() req: any) {
    return this.governance.documents
      .find({ memberId: req.authMember._id })
      .select("_id filename mime createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }
  @Get(":id")
  async download(@Req() req: any, @Res() res: any, @Param("id") id: string) {
    const filter: any = { _id: objectId(id) };
    if (req.authMember.memberType !== "ADMIN")
      filter.memberId = req.authMember._id;
    const doc: any = await this.governance.documents.findOne(filter).lean();
    if (!doc) throw new BadRequestException("Document not found.");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", doc.mime);
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="seller-document"',
    );
    return res.sendFile(resolve(root(), doc.storageName));
  }
}
