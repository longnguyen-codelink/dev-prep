import { DogsModule } from "@/modules/domain/dogs/dogs.module";
import { DatabaseModule } from "@/modules/tech/database/database.module";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [
		// Service Modules
		DatabaseModule,
		// Domain Modules
		DogsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
