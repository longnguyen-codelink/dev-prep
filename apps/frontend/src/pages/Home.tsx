"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1),
	name_1454933707: z.string(),
	name_2893502364: z.string(),
});

export default function Home() {
	const [files, setFiles] = useState<File[] | null>(null);

	const dropZoneConfig = {
		maxFiles: 5,
		maxSize: 1024 * 1024 * 4,
		multiple: true,
	};
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			console.log(values);
			console.log(files, setFiles, dropZoneConfig);
			toast(
				<pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
					<code className='text-white'>{JSON.stringify(values, null, 2)}</code>
				</pre>,
			);
		} catch (error) {
			console.error("Form submission error", error);
			toast.error("Failed to submit the form. Please try again.");
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 max-w-3xl mx-auto py-10'>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<Field>
							<FieldLabel htmlFor='name'>Name</FieldLabel>
							<Input id='name' placeholder='your name' {...form.register("name")} />
							<FieldDescription>This is your public display name.</FieldDescription>
							<FieldError>{form.formState.errors.name?.message}</FieldError>
						</Field>
					</div>

					<div className='col-span-12'>
						<Field>
							<FieldLabel htmlFor='name_1454933707'>Bio</FieldLabel>
							<Textarea id='name_1454933707' placeholder='Placeholder' {...form.register("name_1454933707")} />
							<FieldDescription>You can @mention other users and organizations.</FieldDescription>
							<FieldError>{form.formState.errors.name_1454933707?.message}</FieldError>
						</Field>
					</div>

					<div className='col-span-12'>
						<Field>
							<FieldLabel htmlFor='name_2893502364'>Select File</FieldLabel>
							<Input id='name_2893502364' type='file' placeholder='Placeholder' {...form.register("name_2893502364")} />
							<FieldDescription>Select a file to upload.</FieldDescription>
							<FieldError>{form.formState.errors.name_2893502364?.message}</FieldError>
						</Field>
					</div>
				</div>
				<Button type='submit'>Submit</Button>
			</form>
		</Form>
	);
}
