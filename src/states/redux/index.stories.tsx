import type { Meta, StoryObj } from "@storybook/react-vite";
import { store, incremented } from "./provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const meta: Meta = {
	title: "States/Redux",
	tags: ["autodocs"],
	parameters: {
		docs: {
			description: {
				component: `
## What is Redux?

Redux is a predictable state container for JavaScript applications, commonly used with React. It helps manage application state in a single, centralized store, making it easier to reason about state changes and debug applications.

**Key Concepts:**
- **Store**: The single source of truth that holds the entire application state
- **Actions**: Plain objects that describe what happened and are dispatched to the store
- **Reducers**: Pure functions that take the current state and an action, and return a new state
- **Dispatch**: The method used to send actions to the store to update the state
- **Selectors**: Functions that extract specific pieces of state from the store

## Use Cases

Redux is ideal for:
- **Complex State Management**: Applications with complex state interactions
- **Predictable State Changes**: Ensuring state changes are explicit and traceable
- **Debugging**: Time-travel debugging and logging of state changes
- **Server-Side Rendering**: Managing state in SSR applications
- **Large-Scale Applications**: Where multiple developers need to manage shared state

## How This Example Works

This story demonstrates a simple **Counter** using Redux Toolkit:

1. **Store Configuration**: The store is configured using \`configureStore\` from Redux Toolkit, which simplifies setup and includes good defaults.

2. **Slice Creation**: A slice named "counter" is created using \`createSlice\`, which automatically generates action creators and action types based on the provided reducers.

3. **Reducers**:
   - \`incremented\`: Increases the counter value by 1
   - \`decremented\`: Decreases the counter value by 1

4. **Dispatching Actions**: Actions are dispatched to update the state, and the store logs the updated state to the console.

**Try it:** Open the console to see the state changes as actions are dispatched!
                `,
			},
		},
	},
};

export default meta;
type Story = StoryObj;
export const Default: Story = {
	render: function ReduxExample() {
		const [count, setCount] = useState(store.getState().value);
		store.subscribe(() => setCount(store.getState().value));

		return (
			<div>
				<h3>Count: {count}</h3>
				<Button onClick={() => store.dispatch(incremented())}>Increment</Button>
			</div>
		);
	},
};
