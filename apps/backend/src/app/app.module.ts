import { DogsModule } from "@/modules/domain/dogs/dogs.module";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";

@Module({
	imports: [
		// Starter Modules
		ConfigModule.forRoot(),
		SequelizeModule.forRoot({
			dialect: "oracle",
			host: "localhost",
			port: 1521,
			username: "SYSTEM",
			password: "<your_password>",
			database: "XE",
		}),
		// Domain Modules
		DogsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
