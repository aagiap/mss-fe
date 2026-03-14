
import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

const PublicRoute = ({ children }) => {
    const token = getToken();
    return token ? <Navigate to="/home" replace /> : children;
};

export default PublicRoute;