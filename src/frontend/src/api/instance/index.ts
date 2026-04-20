import Axios, { type AxiosRequestConfig } from "axios";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: "/api",
});

// Token getter — set by AuthProvider on mount
let tokenGetter: (() => string | null) | null = null;

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

// Request interceptor: attach Bearer token
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = tokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let refreshPromise: Promise<string> | null = null;

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;

      try {
        // Single-flight refresh
        if (!refreshPromise) {
          refreshPromise = AXIOS_INSTANCE.post("/auth/token/refresh").then(
            (res) => {
              refreshPromise = null;
              return res.data.accessToken as string;
            },
            (err) => {
              refreshPromise = null;
              throw err;
            }
          );
        }

        const newToken = await refreshPromise;

        // Update the module-level token via the auth context's setter
        // The AuthProvider will listen for this via its own mechanism.
        // For the retry, we set the header directly.
        original.headers.Authorization = `Bearer ${newToken}`;
        return AXIOS_INSTANCE(original);
      } catch {
        // Refresh failed — redirect to login
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error — cancel property used by react-query
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export default customInstance;
