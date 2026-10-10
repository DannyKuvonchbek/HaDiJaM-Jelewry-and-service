import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
            context: ({ req, res }) => ({ req, res }),
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			autoSchemaFile: true,
		}),
		ComponentsModule,
		DatabaseModule,
	],
	providers: [AppService, AppResolver],
})
export class AppModule {}
