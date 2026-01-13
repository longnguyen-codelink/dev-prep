import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { VideoService } from "./video.service";
import { VideoCreationDTO, VideoCreationResponseDTO } from "./dto/video.dto";

@Controller("video")
export class VideoController {
	constructor(private readonly videoService: VideoService) {}

	@Post()
	@ApiOperation({ summary: "Create a new video" })
	@ApiBody({ type: VideoCreationDTO })
	@ApiOkResponse({ description: "Video created successfully", type: VideoCreationResponseDTO })
	public create(@Body() body: VideoCreationDTO) {
		return this.videoService.createMetadata(body);
	}
}
