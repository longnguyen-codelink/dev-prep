import { BreedModule } from "@/modules/domain/breed/breed.module";
import { DatabaseModule } from "@/modules/tech/database/database.module";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		// Service Modules
		DatabaseModule,
		// Domain Modules
		BreedModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
