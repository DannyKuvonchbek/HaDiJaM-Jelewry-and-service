import "reflect-metadata";
import { allowedOrigins } from "./components/auth/sessions/auth-security";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { AppModule } from "./app.module";
import { graphqlUploadExpress } from "graphql-upload";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: allowedOrigins(),
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Hadijam-CSRF",
      "Apollo-Require-Preflight",
    ],
    methods: ["GET", "POST", "OPTIONS"],
  });
  app.use(
    (
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      if (process.env.NODE_ENV === "production")
        res.setHeader(
          "Strict-Transport-Security",
          "max-age=31536000; includeSubDomains",
        );
      next();
    },
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.use(
    "/graphql",
    graphqlUploadExpress({ maxFileSize: 25000000, maxFiles: 10 }),
  );
  app.use(
    "/uploads",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(req.path);
      } catch {
        res.status(400).end();
        return;
      }
      if (/^\/(atelier|service-bookings)(\/|$)/i.test(decodedPath)) {
        res.status(404).end();
        return;
      }
      next();
    },
    express.static("./uploads"),
  );
  app.useWebSocketAdapter(new WsAdapter(app));
  if (process.env.NODE_ENV === "production")
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  await app.listen(
    process.env.PORT ?? 9702,
    process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0",
  );
}

void bootstrap();
