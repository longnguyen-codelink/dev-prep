declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

// The shape of the generated env-config.js (window.__ENV__), the same keys as .env.example. Both are optional
// (unset or empty means the default), and values are plain strings; readEnv (src/config) still validates them.
type RuntimeEnv = {
  // Origin, optionally followed by a path prefix, of the host serving the static map files (/map/...). Unset = the same origin as the app.
  MAP_HOST?: string;
  // Basemap style JSON URL. Unset = the OpenFreeMap default.
  BASEMAP_STYLE_URL?: string;
};

interface Window {
  __ENV__?: RuntimeEnv;
}
