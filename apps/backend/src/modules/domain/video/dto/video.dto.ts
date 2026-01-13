import { ApiProperty } from "@nestjs/swagger";

export class VideoCreationDTO {
	@ApiProperty({ description: "Title of the video" })
	declare title: string;

	@ApiProperty({ description: "Description of the video", required: false })
	declare description?: string;

	@ApiProperty({ description: "Filename of the video, including extension" })
	declare fileName: string;
}

export class VideoCreationResponseDTO {
	@ApiProperty({ description: "ID of the created video" })
	declare id: string;

	@ApiProperty({ description: "Presigned URL for uploading the video" })
	declare presignedUrl: string;
}
