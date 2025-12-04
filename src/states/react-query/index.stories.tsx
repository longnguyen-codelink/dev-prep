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
				component: `
## What is React Query (TanStack Query)?

React Query is a powerful data-fetching and state management library for React applications. It manages server state, providing automatic caching, background updates, and synchronization of server data.

**Key Features:**
- **Automatic Caching**: Fetched data is cached and reused across components
- **Background Refetching**: Keeps data fresh with automatic background updates
- **Loading & Error States**: Built-in status management for async operations
- **Dependent Queries**: Enable queries based on other data (e.g., fetch wards after selecting a province)
- **Query Invalidation**: Automatically refetch when data becomes stale

## Use Cases

React Query is ideal for:
- **API Data Fetching**: REST APIs, GraphQL, or any async data source
- **Server State Management**: Managing data from external sources (different from client state like form inputs)
- **Dependent/Cascading Requests**: When one query depends on another's result
- **Real-time Data**: Auto-refresh data in the background
- **Optimistic Updates**: Update UI before server confirms changes

## How This Example Works

This story demonstrates a **Province & Ward Selector** using React Query:

1. **QueryProvider**: Wraps the app with \`QueryClientProvider\` to enable React Query functionality throughout the component tree

2. **Province Query**:
   - \`queryKey: ["provinces"]\` - Unique identifier for caching
   - \`queryFn: fetchProvinces\` - Fetches all provinces from API
   - Loads automatically when component mounts

3. **Ward Query (Dependent Query)**:
   - \`queryKey: ["ward", selectedProvince]\` - Cache key includes the province ID
   - \`enabled: !!selectedProvince\` - Only runs when a province is selected
   - Automatically refetches when \`selectedProvince\` changes

4. **Benefits Demonstrated**:
   - Selecting the same province again won't refetch (cached)
   - Loading states (\`isFetched\`) control UI rendering
   - Dependent query pattern for cascading dropdowns

**Try it:** Select a province to trigger the ward query. Notice how switching back to a previously selected province is instant (cached data)!
				`,
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
