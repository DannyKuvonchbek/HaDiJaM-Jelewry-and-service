import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => {
				const uriKey = process.env.NODE_ENV === 'production' ? 'MONGODB_URI' : 'MONGO_URL';
				const uri = process.env[uriKey];
				if (!uri) throw new Error(`${uriKey} is required for ${process.env.NODE_ENV ?? 'development'}`);
				return { uri };
			},
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {}
