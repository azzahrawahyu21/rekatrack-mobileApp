// utils/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// Buat dari environment agar mudah beda dev/staging/prod
export const API_URL = process.env.REKATRACK_API ?? "https://rekatrack.ptrekaindo.co.id/api";

// Timeout fetch
const fetchWithTimeout = (url: string, options: any, timeout = 15000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem("token");

  const headers = {
    Accept: "application/json",
    // Hanya set Content-Type jika body bukan FormData
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response: any = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Tangani token expired / unauthorized
    if (response.status === 401) {
      await AsyncStorage.removeItem("token");
      throw {
        status: 401,
        message: "Session expired. Please login again.",
      };
    }

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

    // Format konsisten yang bisa Anda tampilkan di UI
    throw {
      status: error?.status ?? 0,
      message: error?.message ?? "Network error",
      raw: error,
    };
  }
};


// Opsional: Fungsi utilitas untuk membuka PDF (jika nanti dibutuhkan)
// export async function viewPDF(type: string, id: number) {
//   try {
//     const data = await apiFetch(`/${type}/${id}/pdf`, { method: "GET" });
//     if (data?.url) {
//       await Linking.openURL(data.url);
//     } else {
//       throw new Error("PDF URL not found");
//     }
//   } catch (error) {
//     console.error("View PDF Error:", error);
//     throw error;
//   }
// }