import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment } from "react";

import { ThemeProvider, useTheme } from "./provider";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ThemeProvider> = {
	title: "States/Context",
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component: `
## What is Context API?

The Context API is a React feature that provides a way to share data across the component tree without having to pass props down manually at every level. It's ideal for "global" data like themes, user authentication, or language preferences.

**Key Concepts:**
- **Provider**: Wraps components and provides the context value to all descendants
- **Consumer**: Components that access the context using \`useContext\` hook
- **Avoids Prop Drilling**: Eliminates the need to pass props through intermediate components

## Use Cases

Context API is perfect for:
- **Theme/Dark Mode**: Managing UI theme across the entire app (like this example)
- **Authentication**: Sharing user login state and user data throughout the app
- **Localization/i18n**: Providing language preferences and translations
- **User Preferences**: Storing settings like font size, layout preferences
- **Global UI State**: Modal state, sidebar open/closed, notification systems
- **Multi-step Forms**: Sharing form data across different steps/pages

**When NOT to use Context:**
- Frequently updating data (can cause performance issues)
- Server state/API data (use React Query, SWR, or similar libraries instead)
- Complex state logic (consider Redux, Zustand for better devtools and middleware)

## How This Example Works

This story demonstrates a **Theme Management** system using Context API:

1. **ThemeProvider**: A context provider component that:
   - Manages theme state (light/dark/system)
   - Persists theme preference in localStorage
   - Applies theme classes to the document root
   - Provides \`theme\` and \`setTheme\` to all child components

2. **useTheme Hook**: A custom hook that allows any component inside the provider to:
   - Access the current theme value
   - Toggle between themes using \`setTheme\`

3. **Component Examples**:
   - **StorybookButtonChangeTheme**: Uses context to toggle the theme
   - **StorybookContextExample**: Wrapped inside \`ThemeProvider\` - successfully reads the theme
   - **StorbookNoContextExample**: Outside the provider - will throw an error as it can't access the context

**Try it:** Click the "Change Theme" button to see how all components inside the provider update automatically without prop passing!
				`,
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
