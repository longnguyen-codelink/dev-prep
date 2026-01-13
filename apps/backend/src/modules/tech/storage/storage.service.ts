import { Injectable, Logger } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);

	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	constructor(private configService: ConfigService) {
		this.bucketName = this.configService.get<string>("STORAGE_BUCKET_NAME")!;

		this.s3Client = new S3Client({
			region: "us-east-1", // SeaweedFS ignores this, but SDK requires it
			endpoint: this.configService.get<string>("STORAGE_ENDPOINT"), // http://localhost:8333
			credentials: {
				accessKeyId: this.configService.get<string>("STORAGE_ACCESS_KEY")!,
				secretAccessKey: this.configService.get<string>("STORAGE_SECRET_KEY")!,
			},
			forcePathStyle: true, // <--- CRITICAL for SeaweedFS/MinIO
		});
	}

	public get bucket() {
		return this.bucketName;
	}

	public async getPresignedUploadUrl(fileName: string, fileType: string) {
		try {
			const command = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: fileName,
				ContentType: fileType, // Enforces that the frontend sends the correct type
			});

			// Generate a URL that expires in 5 minutes (300 seconds)
			const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });

			return {
				url: url,
				method: "PUT",
				fields: { "Content-Type": fileType },
			};
		} catch (error) {
			this.logger.error(`Failed to generate presigned URL: ${error.message}`);
			throw error;
		}
	}

	public async getFileTypeFromName(fileName: string): Promise<string | null> {
		try {
			// Simple extraction of file extension
			const parts = fileName.split(".");
			if (parts.length > 1) {
				const extension = parts.pop()!.toLowerCase();
				// A more comprehensive mapping can be added here
				const mimeTypes: { [key: string]: string } = {
					jpg: "image/jpeg",
					jpeg: "image/jpeg",
					png: "image/png",
					gif: "image/gif",
					pdf: "application/pdf",
					txt: "text/plain",
					doc: "application/msword",
					docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
					mp4: "video/mp4",
					mp3: "audio/mpeg",
				};
				return mimeTypes[extension] || null;
			}

			return "";
		} catch (error) {
			this.logger.error(`Failed to get file type: ${error.message}`);
			return null;
		}
	}
}
