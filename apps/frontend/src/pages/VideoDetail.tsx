import { getRouteApi } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetVideoById } from "@/api/endpoint";

const routeApi = getRouteApi("/video/$videoId");

export function VideoDetail() {
	const { videoId } = routeApi.useParams();
	const { data } = useGetVideoById(videoId);

	return (
		<div className='flex flex-col gap-3'>
			{/* Video section */}
			{data ? <video className='w-full h-100 bg-black' controls src={data.presignedUrl} /> : <Skeleton className='w-full h-100' />}

			{/* Metadata section */}
			<div className='flex flex-col w-full items-start'>
				<h1 className='text-2xl font-bold'>{data?.title}</h1>
				<p className='mt-2'>{data?.description}</p>
			</div>
		</div>
	);
}
