import {getToken} from "../utils/auth";
import api from "./api";


export async function login(username, password) {
    try {
        const response = await api.post("/auth/login", {
            username,
            password
        });

        return response.data;

    } catch (error) {
        const errorMessage = error.response?.data?.message || "Login failed";
        throw new Error(errorMessage);
    }
}

export const getUser = async () => {
    try {
        const response = await api.get("/auth/employee/me");
        return response.data.data;
    } catch (e) {
        console.error("getUser error:", e.response?.data || e.message);
        return null;
    }
}

