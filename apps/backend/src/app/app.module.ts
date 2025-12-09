import { DogsModule } from "@/modules/domain/dogs/dogs.module";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@/modules/tech/database/database.module";

@Module({
	imports: [
		// Starter Modules
		ConfigModule.forRoot(),
		// Service Modules
		DatabaseModule,
		// Domain Modules
		DogsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
