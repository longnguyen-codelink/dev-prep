import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { DatabaseService } from "./database.service";
import { DatabaseConfig, DatabaseConfigDto } from "./dto/database-config.dto";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: void DatabaseConfigDto.parse,
			load: [
				() => {
					return {
						database: {
							host: process.env.Database__host,
							port: Number(process.env.Database__port),
							username: process.env.Database__user,
							password: process.env.Database__password,
							database: process.env.Database__database,
							dialect: process.env.Database__dialect,
						} satisfies DatabaseConfig,
					};
				},
			],
		}),
		SequelizeModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => configService.get<DatabaseConfig>("database")!, // Safe due to validation
			inject: [ConfigService],
		}),
	],
	providers: [DatabaseService],
})
export class DatabaseModule {}
