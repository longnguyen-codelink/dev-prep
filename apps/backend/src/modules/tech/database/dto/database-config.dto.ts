import z from "zod";

export type DatabaseConfig = z.infer<typeof DatabaseConfigDto>;
export const DatabaseConfigDto = z.object({
	dialect: z.enum(["mysql", "postgres", "sqlite", "mariadb", "mssql", "db2", "snowflake", "oracle"]),
	host: z.string(),
	port: z.number(),
	username: z.string(),
	password: z.string(),
	database: z.string(),
});
