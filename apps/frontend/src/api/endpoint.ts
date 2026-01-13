import { client } from "./client";
import type { GetVideoResponse, PostVideoBody, PostVideoResponse } from "./model";
import { useMutation, useQuery } from "@tanstack/react-query";

export const postVideo = (body: PostVideoBody) => {
	return client<PostVideoResponse>({
		method: "POST",
		url: "/videos",
		data: body,
	});
};
export const usePostVideo = () => {
	return useMutation({
		mutationFn: (body: PostVideoBody) => postVideo(body),
	});
};

export const uploadVideoFile = (url: string, file: File) => {
	return client({
		url: url,
		baseURL: "",
		method: "PUT",
		data: file,
		headers: { "Content-Type": file.type },
	});
};
export const useUploadVideoFile = () => {
	return useMutation({
		mutationFn: ({ url, file }: { url: string; file: File }) => uploadVideoFile(url, file),
	});
};

export const getVideoById = (id: string) => {
	return client<GetVideoResponse>({
		method: "GET",
		url: `/videos/${id}`,
	});
};
export const useGetVideoById = (id: string) => {
	return useQuery({
		queryKey: ["video", id],
		queryFn: () => getVideoById(id),
		enabled: !!id,
	});
};
