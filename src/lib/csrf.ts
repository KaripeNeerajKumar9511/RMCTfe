import Cookies from "js-cookie"

export function getCSRFToken() {
  return Cookies.get("csrftoken")
}

export function clearCSRFToken() {
  Cookies.remove("csrftoken")
}