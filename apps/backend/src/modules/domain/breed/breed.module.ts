import { Module } from "@nestjs/common";
import { BreedController } from "./breed.controller";
import { BreedService } from "./breed.service";

@Module({
	imports: [],
	controllers: [BreedController],
	providers: [BreedService],
})
export class BreedModule {}
