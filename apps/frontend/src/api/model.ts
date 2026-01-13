export interface PostVideoBody {
	title: string;
	description: string;
	fileName: string;
}

export interface PostVideoResponse {
	id: string;
	presignedUrl: string;
}

export interface GetVideoResponse {
	id: string;
	title: string;
	description: string;
	presignedUrl: string;
}
