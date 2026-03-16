import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
export default function OrderNavbar({ currentUser, activePage, onLogout}) {
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (currentUser?.storeId) {
            api.get(`/auth/stores/${currentUser.storeId}`)
                .then(res => setStoreName(res.data?.data?.name || `Store #${currentUser.storeId}`))
                .catch(() => setStoreName(`Store #${currentUser.storeId}`));
        }
    }, [currentUser?.storeId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const navItems = [
        { label: "POS", path: "/orders/create" },
        { label: "Order History", path: "/orders" },
        { label: "Revenue", path: "/orders/revenue" },
    ];

    return (
        <div style={{
            background: "#fff", borderBottom: "1px solid #ddd",
            padding: "10px 24px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 100
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <div style={{
                    width: 40, height: 40, background: "#f0f0f0",
                    borderRadius: 6, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18
                }}>🏪</div>
                <div style={{ display: "flex", gap: 32, fontWeight: 500 }}>
                    {navItems.map(item => (
                        <span
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            style={{
                                cursor: "pointer",
                                color: activePage === item.label ? "#222" : "#888",
                                borderBottom: activePage === item.label ? "2px solid #222" : "2px solid transparent",
                                paddingBottom: 4,
                                transition: "all 0.15s"
                            }}
                        >
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>

            {currentUser && (
                <div style={{ position: "relative" }} ref={dropdownRef}>
                    <div
                        onClick={() => setShowDropdown(v => !v)}
                        style={{
                            display: "flex", alignItems: "center", gap: 10,
                            cursor: "pointer", padding: "4px 8px", borderRadius: 8,
                            background: showDropdown ? "#f5f5f5" : "transparent"
                        }}
                    >
                        <div style={{ textAlign: "right", fontSize: 14 }}>
                            <div style={{ fontWeight: 600 }}>{currentUser.fullName}</div>
                            <div style={{ color: "#888", fontSize: 12 }}>{storeName}</div>
                        </div>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%", background: "#222",
                            color: "#fff", display: "flex", alignItems: "center",
                            justifyContent: "center", fontWeight: 700, fontSize: 16
                        }}>
                            {currentUser.fullName?.charAt(0)}
                        </div>
                    </div>

                    {showDropdown && (
                        <div style={{
                            position: "absolute", right: 0, top: "calc(100% + 8px)",
                            background: "#fff", borderRadius: 8,
                            border: "1px solid #e5e5e5",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            minWidth: 180, zIndex: 200, overflow: "hidden"
                        }}>
                            <div style={{
                                padding: "12px 16px", borderBottom: "1px solid #f0f0f0",
                                background: "#fafafa"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{currentUser.fullName}</div>
                                <div style={{ color: "#888", fontSize: 12 }}>{storeName}</div>
                                <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>
                                    {currentUser.role?.replace("ROLE_", "")}
                                </div>
                            </div>
                            <div
                                onClick={onLogout}
                                style={{
                                    padding: "10px 16px", cursor: "pointer",
                                    fontSize: 14, color: "#dc3545",
                                    display: "flex", alignItems: "center", gap: 8
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <span></span> Logout
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}