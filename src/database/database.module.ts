import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => {
				const uri = process.env.MONGODB_URI ?? process.env.MONGO_URL;
				if (!uri) throw new Error('MONGODB_URI or MONGO_URL is required');
				return { uri };
			},
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {}
