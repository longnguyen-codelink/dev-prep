declare namespace NodeJS {
	interface ProcessEnv {
		database__dialect: import("sequelize").Dialect;
		database__host: string;
		database__password: string;
		database__port: string;
		database__user: string;
		database__database: string;
	}
}
