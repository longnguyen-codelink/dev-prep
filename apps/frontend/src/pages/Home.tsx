"use client";
import { usePostVideo, useUploadVideoFile } from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	file: z
		.instanceof(FileList)
		.refine((files) => files.length > 0, "Please select a file.")
		.refine((files) => files.length === 1, "Please select only one file.")
		.refine((files) => files[0]?.type == "video/mp4", "Only MP4 video files are allowed."),
});

export function Home() {
	const [redirectId, setRedirectId] = useState<string | null>(null);
	const { mutateAsync: createVideoMetadata, isError: postVideoError } = usePostVideo();
	const { mutateAsync: uploadVideo, isPending: uploading, isError: uploadVideoError } = useUploadVideoFile();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const file = values.file[0];
			const { id, presignedUrl } = await createVideoMetadata({
				title: values.title,
				description: values.description,
				fileName: file.name,
			});

			await uploadVideo({ url: presignedUrl, file });
			setRedirectId(id);
			form.reset();
			console.log(redirectId);

			toast(
				<pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
					<code className='text-white'>Success</code>
				</pre>,
			);
		} catch (error) {
			console.error("Form submission error", error);

			if (postVideoError) {
				toast.error("Failed to create video metadata. Please try again.");
				return;
			}

			if (uploadVideoError) {
				toast.error("Failed to upload video file. Please try again.");
				return;
			}

			toast.error("Failed to submit the form. Please try again.");
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 max-w-3xl mx-auto py-10'>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<Field>
							<FieldLabel htmlFor='title'>Title</FieldLabel>
							<Input id='name' placeholder='File name' {...form.register("title")} />
							<FieldDescription>File name.</FieldDescription>
							<FieldError>{form.formState.errors.title?.message}</FieldError>
						</Field>
					</div>

					<div className='col-span-12'>
						<Field>
							<FieldLabel htmlFor='description'>Description</FieldLabel>
							<Textarea id='description' placeholder='Placeholder' {...form.register("description")} />
							<FieldDescription>File Description</FieldDescription>
							<FieldError>{form.formState.errors.description?.message}</FieldError>
						</Field>
					</div>

					<div className='col-span-12'>
						<Field>
							<FieldLabel htmlFor='file'>Select File</FieldLabel>
							<Input id='file' type='file' placeholder='Placeholder' {...form.register("file")} />
							<FieldDescription>Select a file to upload.</FieldDescription>
							<FieldError>{form.formState.errors.file?.message}</FieldError>
						</Field>
					</div>
				</div>

				<div className='flex gap-2'>
					<Button className='cursor-pointer' type='submit' disabled={uploading}>
						{uploading ? "Uploading..." : "Upload Video"}
					</Button>

					<Button variant='link' className='cursor-pointer' disabled={!!!redirectId}>
						{redirectId ? (
							<Link to={`/video/$videoId`} params={{ videoId: redirectId }}>
								View Video
							</Link>
						) : (
							"View Video"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
