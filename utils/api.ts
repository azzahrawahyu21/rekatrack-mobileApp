// utils/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// const API_URL = "http://192.168.1.11:8000/api";
const API_URL = "https://treponemal-eryn-vanillic.ngrok-free.dev/api";

// fetch dengan timeout
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 15000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = await AsyncStorage.getItem("token");

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = (await fetchWithTimeout(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    )) as Response;

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Unauthorized
    if (response.status === 401) {
      await AsyncStorage.removeItem("token");
      throw {
        status: 401,
        message: "Session expired. Please login again.",
      };
    }

    // Error lain
    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || "Request failed",
        data,
      };
    }

    return data;
  } catch (error: any) {
    console.error("API ERROR:", error);
    throw {
      status: error?.status ?? 0,
      message: error?.message ?? "Network error",
      raw: error,
    };
  }
};
