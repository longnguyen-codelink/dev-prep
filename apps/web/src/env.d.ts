declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

// window.__ENV__ is set by /env-config.js (see .env.example).
interface Window {
  __ENV__?: { MAP_HOST?: string; BUILD_COMMIT?: string; BUILD_REPO_URL?: string };
}
