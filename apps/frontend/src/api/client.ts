import Axios, { type AxiosRequestConfig } from "axios";

const axios = Axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const client = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
	const source = Axios.CancelToken.source();
	const promise = axios({
		...config,
		...options,
	}).then(({ data, status }) => {
		return data instanceof Blob ? data : { ...data, statusCode: status };
	});

	// @ts-expect-error not exist cancel
	promise.cancel = () => {
		source.cancel("Query was cancelled");
	};
	return promise;
};
