import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment } from "react";

import { ThemeProvider, useTheme } from "./_provider";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ThemeProvider> = {
	title: "States/Context",
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
type Story = StoryObj<typeof ThemeProvider>;
export const Default: Story = {
	render: () => {
		return (
			<Fragment>
				<ThemeProvider>
					<StorybookButtonChangeTheme />

					<StorybookContextExample />
				</ThemeProvider>

				<StorbookNoContextExample />
			</Fragment>
		);
	},
};

function StorybookButtonChangeTheme() {
	const context = useTheme();
	return (
		<div className='w-full'>
			<Button onClick={() => context.setTheme(context.theme != "light" ? "light" : "dark")}>Change Theme</Button>
		</div>
	);
}

function StorybookContextExample() {
	const context = useTheme();
	return (
		<div className='text-blue-400'>
			(This component receive Context) Current theme: <span className='font-bold'>{context.theme}</span>
		</div>
	);
}

function StorbookNoContextExample() {
	const context = useTheme();
	return (
		<div className='text-blue-400'>
			(This component does not receive Context) Current theme: <span className='font-bold'>{context.theme}</span>
		</div>
	);
}
