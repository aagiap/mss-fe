import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    Menu,
    MenuItem,
    Avatar,
    ListItemIcon,
    Divider
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// Nhớ import API getUser của bạn vào đây
import { getUser } from '../../api/auth'; // Sửa lại đường dẫn file API cho đúng
import ProfilePopup from './ProfilePopup'; // Sửa đường dẫn nếu cần

const Header = () => {
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Fetch dữ liệu user khi component được mount
    useEffect(() => {
        const fetchUserData = async () => {
            const data = await getUser();
            if (data) {
                setUser(data);
            }
        };
        fetchUserData();
    }, []);

    // Xử lý đóng/mở Dropdown Menu
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    // Xử lý mở popup Profile
    const handleOpenProfile = () => {
        setIsProfileOpen(true);
        handleMenuClose();
    };

    // Xử lý Đăng xuất
    const handleLogout = () => {
        handleMenuClose();
        // Thêm logic xóa token trong localStorage và chuyển hướng về trang login ở đây
        // Ví dụ:
        // localStorage.removeItem('token');
        // window.location.href = '/login';
        console.log("Đã click Logout");
    };

    return (
        <>
            <AppBar position="sticky" sx={{ backgroundColor: '#ffffff', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    {/* LOGO / TÊN HỆ THỐNG */}
                    <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                        Retail Chain System
                    </Typography>

                    {/* USER INFO & DROPDOWN */}
                    {user && (
                        <Box>
                            <Button
                                onClick={handleMenuOpen}
                                endIcon={<KeyboardArrowDownIcon />}
                                sx={{ color: '#334155', textTransform: 'none', borderRadius: 2, px: 2, py: 1 }}
                            >
                                <Avatar
                                    sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#0f172a', fontSize: '0.875rem', fontWeight: 700 }}
                                >
                                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                                </Avatar>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                    {user.fullName || user.username}
                                </Typography>
                            </Button>

                            {/* DROPDOWN MENU */}
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.1))',
                                        mt: 1.5,
                                        width: 200,
                                        borderRadius: 3,
                                        border: '1px solid #e2e8f0'
                                    },
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.fullName}</Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>{user.role?.replace('ROLE_', '')}</Typography>
                                </Box>
                                <Divider />
                                <MenuItem onClick={handleOpenProfile} sx={{ py: 1.5, mt: 1, fontWeight: 600, color: '#334155' }}>
                                    <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                                    My Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout} sx={{ py: 1.5, mb: 0.5, fontWeight: 600, color: '#ef4444' }}>
                                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* KẾT NỐI POPUP */}
            <ProfilePopup
                open={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
            />
        </>
    );
};

export default Header;