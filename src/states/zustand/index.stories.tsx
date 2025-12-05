import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCounterStore } from "./provider";
import { Button } from "@/components/ui/button";

const meta: Meta = {
	title: "States/Zustand",
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component: `
## What is Zustand?

Zustand is a small, fast, and scalable state management library for React applications. It provides a simple and intuitive API for managing global state without the boilerplate of more complex libraries.

**Key Features:**
- **Simplicity**: Minimal API surface, easy to learn and use
- **No Boilerplate**: No need for actions, reducers, or context providers
- **Performance**: Efficient updates with selective re-renders
- **Scalability**: Suitable for both small and large applications
- **Middleware Support**: Easily extendable with middleware for logging, persistence, etc.

## Use Cases

Zustand is ideal for:
- **Global State Management**: Managing application-wide state like user authentication, theme settings, etc.
- **Component State Sharing**: Sharing state between sibling components without prop drilling
- **Complex State Logic**: Handling complex state interactions with ease
- **Performance-Critical Applications**: Where efficient rendering is crucial

## How This Example Works

This story demonstrates a simple **Counter** using Zustand:

1. **useCounterStore**: A Zustand store that manages the counter state with:
   - \`count\`: The current count value
   - \`inc\`: A function to increment the count

2. **CounterDisplay Component**: A React component that:
   - Uses the \`useCounterStore\` hook to access the count and inc function
   - Displays the current count and a button to increment it

3. **Reactivity**: The component automatically re-renders when the count state changes, demonstrating Zustand's efficient state management.

**Try it:** Click the "Increment" button to see the count increase!
                `,
			},
		},
	},
};

export default meta;
type Story = StoryObj;
export const Default: Story = {
	render: function CounterDisplay() {
		const { count, inc } = useCounterStore();
		return (
			<div>
				<h3>Count: {count}</h3>
				<Button onClick={inc}>Increment</Button>
			</div>
		);
	},
};
