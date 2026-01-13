import z from "zod";

export const storageConfigSchema = z.object({
	STORAGE_BUCKET_NAME: z.string(),
	STORAGE_ENDPOINT: z.url(),
	STORAGE_ACCESS_KEY: z.string(),
	STORAGE_SECRET_KEY: z.string(),
});
