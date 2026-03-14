import React, { useState, useContext } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { login as apiLogin } from "../../api/auth";
import { saveToken } from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Login.css";
import BackgroundImage from "../../assets/images/bg4.jpg";
import Logo from "../../assets/images/LOGO-EXE.png";
import { AuthContext } from "../../context/AuthContext";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login: loginContext } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiLogin(username, password);
            const token = data.data.token;
            saveToken(token);
            await loginContext(token);
            navigate("/home");
        } catch (err) {
            console.error(err);
            // Hiển thị message lỗi từ backend nếu có
            setError(err.response?.data?.message || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sign-in__wrapper" style={{ backgroundImage: `url(${BackgroundImage})` }}>
            <div className="sign-in__backdrop"></div>

            <Form className="shadow p-4 bg-white rounded" onSubmit={handleSubmit}>
                {/* Logo */}
                <img className="img-thumbnail mx-auto d-block mb-2 p-0" src={Logo} alt="logo" />

                <div className="h4 mb-2 text-center">Sign In</div>

                {/* Thông báo lỗi */}
                {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

                <Form.Group className="mb-2" controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        value={username}
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-2" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        value={password}
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <Button className="w-100 mt-3" variant="success" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Log In"}
                </Button>
            </Form>

            <div className="w-100 mb-2 position-absolute bottom-0 start-50 translate-middle-x text-white text-center">
                Made by MAYÉ | &copy;2025
            </div>
        </div>
    );
}

export default LoginPage;