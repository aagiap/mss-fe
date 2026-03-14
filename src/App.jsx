import './App.css'
import {AuthProvider} from "./context/AuthProvider.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import HomePage from "./pages/auth/HomePage.jsx";
import Logout from "./components/Logout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";

function App() {

  return (
      <AuthProvider>
        <Router>
          <Routes>
            {/* ================= PUBLIC ROUTES ================= */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />

            <Route path="/home" element={<HomePage />} />

            <Route path="/logout" element={<Logout />} />


            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ================= USER ROUTES ================= */}
            {/*<Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />*/}
            {/* ================= ADMIN ROUTES ================= */}
            {/*<Route path="/admin/*" element={*/}
            {/*  <ProtectedRoute roles={['ROLE_ADMIN']}>*/}
            {/*    <Routes>*/}
            {/*      <Route path="dashboard" element={<AdminDashboard />} />*/}
            {/*    </Routes>*/}
            {/*  </ProtectedRoute>*/}
            {/*} />*/}

            {/* Catch-all: Nếu gõ bậy bạ thì về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>

  )
}

export default App
