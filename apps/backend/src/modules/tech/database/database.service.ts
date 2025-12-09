import { Injectable, Logger } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class DatabaseService {
	private readonly logger = new Logger(DatabaseService.name);

	constructor(private readonly sequelize: Sequelize) {
		this.sequelize.authenticate().catch((err) => {
			this.logger.error("Unable to connect to the database:");
			this.logger.error(err.message);
		});
	}
}
