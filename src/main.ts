import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({ origin: true, credentials: true });
	app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use('/uploads', express.static('./uploads'));
	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT ?? 9702);
}

void bootstrap();
