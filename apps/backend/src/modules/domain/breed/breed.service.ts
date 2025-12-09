import { Injectable } from "@nestjs/common";

@Injectable()
export class BreedService {
	findAll() {
		return "This action returns all dogs";
	}
}
