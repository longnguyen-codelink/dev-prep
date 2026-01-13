import { Test, TestingModule } from "@nestjs/testing";
import { StorageService } from "./storage.service";

describe("Storage", () => {
	let provider: StorageService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [StorageService],
		}).compile();

		provider = module.get<StorageService>(StorageService);
	});

	it("should be defined", () => {
		expect(provider).toBeDefined();
	});
});
