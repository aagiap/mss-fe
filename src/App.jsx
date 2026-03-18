import './App.css'
import {AuthProvider} from "./context/AuthProvider.jsx";
import PublicRoute from "./routes/PublicRoute.jsx";
import HomePage from "./pages/auth/HomePage.jsx";
import Logout from "./components/Logout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import StoreManagementPage from "./pages/admin/StoreManagementPage.jsx";
import EmployeeManagementPage from "./pages/admin/EmployeeManagementPage.jsx";
import CreateOrderPage from "./pages/order/CreateOrderPage.jsx";
import PaymentPage from "./pages/order/PaymentPage.jsx";
import OrderHistoryPage from "./pages/order/OrderHistoryPage.jsx";
import OrderDetailPage from "./pages/order/OrderDetailPage.jsx";
import RevenueReportPage from "./pages/order/RevenueReportPage.jsx";
import ProductList from "./pages/product/ProductList.jsx";
import CategoryList from "./pages/product/CategoryList.jsx";
import AttributeList from "./pages/product/AttributeList.jsx";
import InventoryPage from "./pages/inventory/InventoryPage.jsx";

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
              <Route path="/orders/*" element={
                  <ProtectedRoute roles={["ROLE_CASHIER","ROLE_MANAGER", "ROLE_STAFF"]}>
                      <Routes>
                          <Route path="create" element={<CreateOrderPage />} />
                          <Route path="payment/:orderId" element={<PaymentPage />} />
                          <Route path="/" element={<OrderHistoryPage />} />
                          <Route path=":orderId/detail" element={<OrderDetailPage />} />
                          <Route path="revenue" element={<RevenueReportPage />} />
                      </Routes>
                  </ProtectedRoute>
              } />
            {/*<Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />*/}
            {/* ================= ADMIN ROUTES ================= */}
            <Route path="/admin/*" element={
              <ProtectedRoute roles={['ROLE_ADMIN']}>
                <Routes>
                  <Route path="" element={<Navigate to="store" replace />} />

                  <Route path="store" element={<StoreManagementPage />} />
                  <Route path="employee" element={<EmployeeManagementPage />} />

                    <Route path="product" element={<ProductList/>}/>
                    <Route path="category" element={<CategoryList/>}/>
                    <Route path="attribute" element={<AttributeList/>}/>
                </Routes>
              </ProtectedRoute>
            } />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute roles={["ROLE_STAFF", "ROLE_MANAGER", "ROLE_ADMIN"]}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute roles={["ROLE_STAFF", "ROLE_MANAGER", "ROLE_ADMIN"]}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: Nếu gõ bậy bạ thì về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>

  )
}

export default App
