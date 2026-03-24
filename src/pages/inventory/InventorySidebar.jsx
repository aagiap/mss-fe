export default function InventorySidebar({ activeMenu, setActiveMenu, currentUser }) {
  const menuItems = ["Inventory Reports", "Inventory", "Low Stock", "Update Stock", "Stock In", "Stock Out", "Stock Transfers", "Perform Audit", "Suppliers", "Analytics"];

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        borderRight: "1px solid #e6e9ef",
        background: "#f8f9fb",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflowY: "auto",
      }}
    >
      <div>
        <div style={{ padding: "18px 16px", fontWeight: 700, fontSize: 22, color: "#16253a" }}>RCMS</div>
        <div style={{ padding: "0 10px" }}>
          {menuItems.map((item) => {
            const clickable = item === "Inventory Reports" || item === "Inventory" || item === "Low Stock" || item === "Update Stock" || item === "Stock In" || item === "Stock Out" || item === "Stock Transfers" || item === "Perform Audit" || item === "Suppliers";
            const menuKey = item === "Inventory Reports" ? "Dashboard" : item;
            const isActive = item === "Inventory Reports" ? activeMenu === "Dashboard" : item === activeMenu;
            return (
              <div
                key={item}
                onClick={() => clickable && setActiveMenu(menuKey)}
                style={{
                  padding: "11px 12px",
                  borderRadius: 8,
                  background: isActive ? "#e8ecf2" : "transparent",
                  color: "#334155",
                  fontWeight: isActive ? 700 : 500,
                  marginBottom: 4,
                  fontSize: 14,
                  cursor: clickable ? "pointer" : "default",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e6e9ef", padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser?.fullName || "Inventory User"}</div>
        <div style={{ color: "#8a94a6", fontSize: 12 }}>{currentUser?.role?.replace("ROLE_", "") || "User"}</div>
      </div>
    </aside>
  );
}
