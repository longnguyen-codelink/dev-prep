import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Video } from "./model/video.model";
import { VideoController } from "./video.controller";
import { VideoService } from "./video.service";
import { StorageModule } from "@/modules/tech/storage/storage.module";

@Module({
	controllers: [VideoController],
	providers: [VideoService],
	imports: [SequelizeModule.forFeature([Video]), StorageModule],
})
export class VideoModule {}
