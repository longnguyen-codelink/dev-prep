import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class DatabaseService implements OnModuleInit {
	private readonly logger = new Logger(DatabaseService.name);

	constructor(private readonly sequelize: Sequelize) {}

	public async onModuleInit() {
		/**
		 * Test the database connection
		 * - If the connection is successful, log a success message
		 * - If the connection fails, log an error message
		 */
		await this.sequelize
			.authenticate({ logging: false })
			.then(() => this.logger.log("Database connection established successfully"))
			.catch((error) => this.logger.error("Database connection failed", error));
	}
}
