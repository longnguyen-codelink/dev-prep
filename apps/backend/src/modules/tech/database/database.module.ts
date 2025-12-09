import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { DatabaseService } from "./database.service";
import { DatabaseConfig, DatabaseConfigDto } from "./dto/database-config.dto";
import { models } from "./database.models";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: void DatabaseConfigDto.parse,
			load: [
				() => ({
					// Todo: use mapNestString utility here
					database: {
						host: process.env.database__host,
						port: Number(process.env.database__port),
						username: process.env.database__user,
						password: process.env.database__password,
						database: process.env.database__database,
						dialect: process.env.database__dialect,
					} satisfies DatabaseConfig,
				}),
			],
		}),
		SequelizeModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				...configService.get<DatabaseConfig>("database")!, // Safe due to validation
				models,
				autoLoadModels: true,
			}),
			inject: [ConfigService],
		}),
	],
	providers: [DatabaseService],
})
export class DatabaseModule {}
