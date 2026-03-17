import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Box,
    Avatar,
    Divider
} from '@mui/material';

const ProfilePopup = ({ open, onClose, user }) => {
    if (!user) return null;

    // Làm gọn tên Role (Ví dụ: ROLE_MANAGER -> Manager)
    const formatRole = (roleStr) => {
        if (!roleStr) return 'N/A';
        const cleanStr = roleStr.replace('ROLE_', '');
        return cleanStr.charAt(0).toUpperCase() + cleanStr.slice(1).toLowerCase();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
                My Profile
            </DialogTitle>
            <DialogContent dividers>
                {/* Phần Header của Profile */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 1 }}>
                    <Avatar
                        sx={{ width: 64, height: 64, mr: 2, bgcolor: '#0f172a', fontSize: '2rem', fontWeight: 'bold' }}
                    >
                        {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {user.fullName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                            @{user.username}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Phần Chi tiết thông tin */}
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>
                            EMPLOYEE ID
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                            EMP-{user.employeeId}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>
                            SYSTEM ROLE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                            {formatRole(user.role)}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.5 }}>
                            ASSIGNED STORE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                            {user.storeName || 'N/A'} {user.storeId ? `(ID: ${user.storeId})` : ''}
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ backgroundColor: '#0f172a', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfilePopup;