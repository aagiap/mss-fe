import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthProvider.jsx";

export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useContext(AuthProvider);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/home" replace />;
    }

    return children;
}


