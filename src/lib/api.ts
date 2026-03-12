import axios, { type InternalAxiosRequestConfig } from "axios"
import { getCSRFToken } from "@/lib/csrf"

const api = axios.create({
    baseURL: "http://localhost:8000",
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

/** Call once on login/signup pages so Django sets the CSRF cookie. */
export async function ensureCsrfCookie() {
  await api.get("/api/csrf/")
}

export default api
