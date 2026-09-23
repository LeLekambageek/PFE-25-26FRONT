import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("api_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("api_token");
      window.location.href = "/login";
    } else if (
      error.response?.status === 403 &&
      error.response.data?.code === "must_change_password" &&
      window.location.pathname !== "/changer-mot-de-passe"
    ) {
      window.location.href = "/changer-mot-de-passe";
    }
    return Promise.reject(error);
  }
);

export default apiClient;