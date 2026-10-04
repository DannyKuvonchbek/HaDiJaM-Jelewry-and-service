import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { SocketModule } from './socket/socket.module';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			autoSchemaFile: true,
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
	],
	providers: [AppService, AppResolver],
})
export class AppModule {}
