import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Video } from "./model/video.model";
import { VideoCreationDTO, VideoCreationResponseDTO } from "./dto/video.dto";
import { StorageService } from "@/modules/tech/storage/storage.service";
import { v7 } from "uuid";

@Injectable()
export class VideoService {
	constructor(
		@InjectModel(Video) private readonly videoModel: typeof Video,
		private readonly storageService: StorageService,
	) {}

	public createMetadata(body: VideoCreationDTO): Promise<VideoCreationResponseDTO> {
		const self = this;
		return this.videoModel.sequelize!.transaction(async (transaction) => {
			const bucketName = self.storageService.bucket;

			const video = await self.videoModel.create(
				{
					id: v7(),
					title: body.title,
					description: body.description,
					url: body.fileName,
					created_at: new Date(),
				},
				{ transaction },
			);

			const fileType = await self.storageService.getFileTypeFromName(body.fileName);
			if (fileType !== "video/mp4") throw new Error("Invalid file type. Only MP4 videos are allowed.");

			const presignedUrl = await self.storageService.getPresignedUploadUrl(body.fileName, fileType);

			return { id: video.id, presignedUrl: presignedUrl.url };
		});
	}

	public async getById(id: string): Promise<VideoCreationResponseDTO | null> {
		const video = await this.videoModel.findByPk(id);
		if (!video) return null;

		const presignedUrl = await this.storageService.getPresignedDownloadUrl(video.url);

		return { id: video.id, presignedUrl: presignedUrl };
	}
}
