import type { Meta, StoryObj } from "@storybook/react-vite";

import { QueryProvider } from "./provider";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchProvinces, fetchWards } from "./_api";
import { useState } from "react";

const meta: Meta<typeof QueryProvider> = {
	title: "States/React Query",
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component: "Another description, overriding the comments",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof QueryProvider>;
export const Default: Story = {
	render: () => {
		return (
			<QueryProvider>
				<StorybookReactQueryExample />
			</QueryProvider>
		);
	},
};

function StorybookReactQueryExample() {
	const [selectedProvince, setSelectedProvince] = useState<number>();

	const { isFetched, data: pronvinceQuery } = useQuery({ queryKey: ["provinces"], queryFn: fetchProvinces });
	const { isFetched: isFetchedWard, data: wardQuery } = useQuery({
		queryKey: ["ward", selectedProvince],
		queryFn: ({ queryKey }) => fetchWards(queryKey[1]!),
		enabled: !!selectedProvince,
	});

	return (
		<main className='flex w-full gap-3'>
			{/* Province */}
			<Select value={selectedProvince?.toString()} onValueChange={(value) => setSelectedProvince(Number(value))}>
				<SelectTrigger className='cursor-pointer'>
					<SelectValue placeholder='Select a province' />
				</SelectTrigger>

				{isFetched && (
					<SelectContent>
						{pronvinceQuery?.data?.map((province) => (
							<SelectItem key={province.code} value={province.code.toString()}>
								{province.name}
							</SelectItem>
						))}
					</SelectContent>
				)}
			</Select>

			{/* Ward */}
			<Select disabled={!selectedProvince || !isFetchedWard}>
				<SelectTrigger className='cursor-pointer'>
					<SelectValue placeholder='Select a ward' />
				</SelectTrigger>

				{isFetchedWard && (
					<SelectContent>
						{wardQuery?.data?.map((ward) => (
							<SelectItem key={ward.code} value={ward.code.toString()}>
								{ward.name}
							</SelectItem>
						))}
					</SelectContent>
				)}
			</Select>
		</main>
	);
}
