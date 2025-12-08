import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class AppService {
	constructor(private readonly sequelize: Sequelize) {
		this.sequelize.authenticate().catch(() => {
			console.error("Unable to connect to the database:");
		});
	}

	getHello(): string {
		return "Hello World!";
	}
}
