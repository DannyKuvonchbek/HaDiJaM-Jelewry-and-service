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
            formatError: (formatted) => {
                // Nest validation errors expose their details under originalError,
                // while the top-level message otherwise says only "Bad Request Exception".
                const original = formatted.extensions?.originalError as { statusCode?: number; message?: string | string[] } | undefined;
                if (original?.statusCode === 400 && Array.isArray(original.message)) {
                    return { ...formatted, message: original.message.filter(value => typeof value === 'string').join('; ') || formatted.message };
                }
                return formatted;
            },
		}),
		ComponentsModule,
		DatabaseModule,
	],
	providers: [AppService, AppResolver],
})
export class AppModule {}
