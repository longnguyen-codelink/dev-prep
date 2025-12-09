declare namespace NodeJS {
	interface ProcessEnv {
		Database__dialect: import("sequelize").Dialect;
		Database__host: string;
		Database__password: string;
		Database__port: string;
		Database__user: string;
		Database__database: string;
	}
}
