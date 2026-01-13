// Root route with Context
import type { QueryClient } from "@tanstack/react-query";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Root } from "./components/layout/Root";
import { VideoDetail } from "./pages/VideoDetail";
import { Home } from "./pages/Home";

export interface MyRouterContext {
	queryClient: QueryClient;
}
const rootRoute = createRootRoute({ component: Root });

const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: Home,
});

const videoDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/video/$videoId",
	component: VideoDetail,
	loader({ params }) {
		console.log("Loading video with ID:", params.videoId);
	},
});

export const routeTree = rootRoute.addChildren([homeRoute, videoDetailRoute]);
