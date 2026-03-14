import React from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

const PrivateRoute = ({ children }) => {
    const token = getToken();
    return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;