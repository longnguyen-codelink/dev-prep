import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { VideoCreationDTO, VideoCreationResponseDTO, VideoResponseDTO } from "./dto/video.dto";
import { VideoService } from "./video.service";

@Controller("videos")
export class VideoController {
	constructor(private readonly videoService: VideoService) {}

	@Post()
	@ApiOperation({ summary: "Create a new video" })
	@ApiBody({ type: VideoCreationDTO })
	@ApiOkResponse({ description: "Video created successfully", type: VideoCreationResponseDTO })
	public create(@Body() body: VideoCreationDTO) {
		return this.videoService.createMetadata(body);
	}

	@Get("/:id")
	@ApiOperation({ summary: "Get a video by id" })
	@ApiOkResponse({ description: "Video found successfully", type: VideoResponseDTO })
	public getById(@Param("id") id: string) {
		return this.videoService.getById(id);
	}
}
