import axios from "axios";

const api = axios.create({
  baseURL: "https://api.snsihub.tech/api/v1",
  timeout: 300000,
  headers: { "Content-Type": "application/json" },
});

export default api;
