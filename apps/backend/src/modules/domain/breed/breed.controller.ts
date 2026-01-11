import { Controller, Get, Param, Post } from "@nestjs/common";
import { BreedService } from "./breed.service";
import { ApiOperation } from "@nestjs/swagger";

@Controller("breed")
export class BreedController {
	constructor(private readonly dogsService: BreedService) {}

	@Get()
	@ApiOperation({ summary: "Get all dogs" })
	public findAll() {
		return this.dogsService.findAll();
	}

	@Post()
	@ApiOperation({ summary: "Create a new dog" })
	public create() {
		return "";
	}

	@Post(":id/image")
	@ApiOperation({ summary: "Upload a dog image" })
	public uploadImage(@Param("id") id: string) {
		return id;
	}

	@ApiOperation({ summary: "Get a dog by ID" })
	@Get(":id")
	public findOne(@Param("id") id: string) {
		return `This action returns a #${id} dog`;
	}
}
