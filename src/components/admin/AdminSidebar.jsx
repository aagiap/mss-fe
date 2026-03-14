import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, ShopOutlined, LogoutOutlined } from '@ant-design/icons';
import { Layout, Menu, Avatar, Button, Typography } from 'antd';

const { Sider } = Layout;
const { Text } = Typography;

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Cấu hình Menu items với key chính là đường dẫn (path)
    const menuItems = [
        {
            key: '/admin/employee',
            icon: <UserOutlined />,
            label: 'Employees',
        },
        {
            key: '/admin/store',
            icon: <ShopOutlined />,
            label: 'Stores',
        },
    ];

    // Xử lý khi click vào menu
    const handleMenuClick = (e) => {
        navigate(e.key);
    };

    // Xử lý khi click nút Logout
    const handleLogout = () => {
        navigate('/logout');
    };

    return (
        <Sider
            width={260}
            style={{
                height: '100vh',
                background: '#ffffff',
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 10px',
            }}
        >
            {/* Phần Menu chính ở trên */}
            <div style={{ flex: 1 }}>
                <Menu
                    mode="inline"
                    // Tự động active menu dựa theo URL hiện tại
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                    items={menuItems.map((item) => ({
                        ...item,
                        style: {
                            borderRadius: '8px',
                            marginBottom: '8px',
                            // So sánh đường dẫn hiện tại để đổi màu
                            backgroundColor: location.pathname === item.key ? '#000000' : 'transparent',
                            color: location.pathname === item.key ? '#ffffff' : '#595959',
                        },
                    }))}
                />
            </div>

            {/* Phần Footer: Thông tin Admin & Logout */}
            <div style={{
                paddingTop: '20px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
            }}>
                {/* Profile info */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0 10px'
                }}>
                    <Avatar
                        size={45}
                        src="https://i.pravatar.cc/150?u=admin"
                        style={{ border: '2px solid #1890ff' }}
                    />
                    <div style={{ marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '14px', lineHeight: '1.2' }}>Admin</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Administrator</Text>
                    </div>
                </div>

                {/* Nút Logout */}
                <Button
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '500',
                        color: '#ff4d4f',
                        borderColor: '#ffccc7'
                    }}
                >
                    Logout
                </Button>
            </div>
        </Sider>
    );
};

export default AdminSidebar;