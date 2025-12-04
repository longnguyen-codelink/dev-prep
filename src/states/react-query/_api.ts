import axios, { type AxiosResponse } from "axios";

// Axios API instance
const axiosInstance = axios.create({
	baseURL: "https://provinces.open-api.vn/api/v2/",
	headers: {
		"Content-Type": "application/json",
	},
});

//
export const fetchProvinces: () => Promise<AxiosResponse<{ name: string; code: number }[]>> = async () => axiosInstance.get("/p");
export const fetchWards: (provinceCode: string | number) => Promise<AxiosResponse<{ name: string; code: number }[]>> = async (provinceCode) =>
	axiosInstance.get(`/w`, { params: { province: provinceCode } });
