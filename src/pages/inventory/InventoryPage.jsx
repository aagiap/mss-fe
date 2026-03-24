import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import { getUser } from "../../api/auth";
import api from "../../api/api";
import InventoryDashboardPanel from "./InventoryDashboardPanel";
import InventoryManagementPanel from "./InventoryManagementPanel";
import SupplierManagementPanel from "./SupplierManagementPanel";
import InventorySidebar from "./InventorySidebar";
import InventoryUpdateStockPanel from "./InventoryUpdateStockPanel";
import InventoryStockInPanel from "./InventoryStockInPanel";
import InventoryStockOutPanel from "./InventoryStockOutPanel";
import InventoryTransferStocksPanel from "./InventoryTransferStocksPanel";
import InventoryLowStockPanel from "./InventoryLowStockPanel";
import InventoryPerformAuditPanel from "./InventoryPerformAuditPanel";

export default function InventoryPage() {
  const [activeMenu, setActiveMenu] = useState("Inventory");
  const [updateStockPrefill, setUpdateStockPrefill] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    const init = async () => {
      setInitLoading(true);
      setInitError("");

      try {
        const user = await getUser();
        setCurrentUser(user);

        const defaultStoreId = user?.storeId ? String(user.storeId) : "";
        let loadedStores = [];

        try {
          const storesRes = await api.get("/auth/stores");
          loadedStores = storesRes.data?.data || [];
        } catch {
          if (defaultStoreId) {
            const oneStoreRes = await api.get(`/auth/stores/${defaultStoreId}`);
            const oneStore = oneStoreRes.data?.data;
            loadedStores = oneStore ? [oneStore] : [];
          }
        }

        setStores(loadedStores);
      } catch (e) {
        setInitError(e.response?.data?.message || "Cannot load inventory page.");
      } finally {
        setInitLoading(false);
      }
    };

    init();
  }, []);

  const isStoreLocked = useMemo(() => {
    return currentUser?.role === "ROLE_STAFF" || currentUser?.role === "ROLE_MANAGER";
  }, [currentUser?.role]);

  const canViewReports = useMemo(() => {
    return currentUser?.role === "ROLE_MANAGER" || currentUser?.role === "ROLE_ADMIN";
  }, [currentUser?.role]);

  const openUpdateStockScreen = (item = null) => {
    setUpdateStockPrefill(item);
    setActiveMenu("Update Stock");
  };

  const goBackToInventory = () => {
    setUpdateStockPrefill(null);
    setActiveMenu("Inventory");
  };

  if (initLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading inventory...
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: "#f4f6f9", overflow: "hidden" }}>
      <div style={{ background: "#fff", height: "100%", display: "flex", overflow: "hidden" }}>
        <InventorySidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} currentUser={currentUser} />

        <main style={{ flex: 1, padding: 22, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
          {initError && <Alert variant="danger">{initError}</Alert>}

          {activeMenu === "Dashboard" && (
            <InventoryDashboardPanel stores={stores} isStoreLocked={isStoreLocked} canViewReports={canViewReports} />
          )}

          {activeMenu === "Inventory" && (
            <InventoryManagementPanel
              currentUser={currentUser}
              stores={stores}
              isStoreLocked={isStoreLocked}
              onNavigateUpdateStock={openUpdateStockScreen}
            />
          )}

          {activeMenu === "Update Stock" && (
            <InventoryUpdateStockPanel
              currentUser={currentUser}
              stores={stores}
              isStoreLocked={isStoreLocked}
              prefillItem={updateStockPrefill}
              onBack={goBackToInventory}
            />
          )}

          {activeMenu === "Stock In" && (
            <InventoryStockInPanel currentUser={currentUser} stores={stores} isStoreLocked={isStoreLocked} />
          )}

          {activeMenu === "Stock Out" && (
            <InventoryStockOutPanel currentUser={currentUser} stores={stores} isStoreLocked={isStoreLocked} />
          )}

          {activeMenu === "Stock Transfers" && (
            <InventoryTransferStocksPanel currentUser={currentUser} stores={stores} isStoreLocked={isStoreLocked} />
          )}

          {activeMenu === "Low Stock" && (
            <InventoryLowStockPanel
              currentUser={currentUser}
              stores={stores}
              isStoreLocked={isStoreLocked}
              onRestock={openUpdateStockScreen}
            />
          )}

          {activeMenu === "Perform Audit" && (
            <InventoryPerformAuditPanel currentUser={currentUser} stores={stores} isStoreLocked={isStoreLocked} />
          )}

          {activeMenu === "Suppliers" && <SupplierManagementPanel currentUser={currentUser} />}

          {activeMenu === "Analytics" && (
            <Alert variant="info" style={{ maxWidth: 520 }}>
              Analytics panel is not implemented yet.
            </Alert>
          )}
        </main>
      </div>
    </div>
  );
}
