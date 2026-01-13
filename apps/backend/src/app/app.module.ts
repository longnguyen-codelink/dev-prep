import { BreedModule } from "@/modules/domain/breed/breed.module";
import { DatabaseModule } from "@/modules/tech/database/database.module";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { VideoModule } from "@/modules/domain/video/video.module";

@Module({
	imports: [
		// Service Modules
		DatabaseModule,
		// Domain Modules
		BreedModule,
		VideoModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
