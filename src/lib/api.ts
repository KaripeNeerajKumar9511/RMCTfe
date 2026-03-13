import axios, { type InternalAxiosRequestConfig } from "axios"
import { getCSRFToken } from "@/lib/csrf"

const baseURL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const api = axios.create({
  baseURL,
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? "").toLowerCase()
  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = getCSRFToken()
    if (token) config.headers.set("X-CSRFToken", token)
  }
  return config
})

// Redirect to login when API returns 401 (session invalid/expired or not sent)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname
      if (!path.startsWith("/login") && !path.startsWith("/signup")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(err)
  }
)

/** Call once on login/signup pages so Django sets the CSRF cookie. */
export async function ensureCsrfCookie() {
  await api.get("/api/csrf/")
}

export default api
