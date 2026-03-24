
import React, { useState, useEffect } from "react";
import { getToken, removeToken } from "../utils/auth";
import { getUser } from "../api/auth";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const token = getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const userData = await getUser();
                if (userData) {
                    localStorage.setItem("userId", userData.userId);
                    setUser(userData);
                }
                else removeToken();
            } catch (error) {
                console.error("Auto fetch user failed:", error);
                removeToken();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);


    const login = async (token) => {
        localStorage.setItem("token", token);
        try {
            const userData = await getUser();
            setUser(userData);
            return userData;
        } catch (error) {
            console.error("Login fetch user failed:", error);
        }
    };


    const logout = () => {
        removeToken();
        localStorage.removeItem("userId");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
