import React from 'react';
import {
    Box, Typography, Button, Grid, Paper, Chip, Avatar, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Link, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StoreDetail = ({ store, onBack, onEdit }) => {
    if (!store) return null;

    // Hàm tiện ích lấy 2 chữ cái đầu của tên làm Avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    // Hàm làm đẹp Role từ định dạng của Backend (VD: ROLE_MANAGER -> Manager)
    const formatRole = (roleString) => {
        if (!roleString) return 'N/A';
        const cleanRole = roleString.replace('ROLE_', '');
        return cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1).toLowerCase();
    };

    return (
        <Box sx={{ p: 5, backgroundColor: '#ffffff', minHeight: '100vh', maxWidth: 1200, mx: 'auto' }}>

            {/* Back Link */}
            <Link
                component="button"
                onClick={onBack}
                underline="none"
                sx={{ display: 'flex', alignItems: 'center', color: '#64748b', mb: 2, fontSize: '0.875rem', fontWeight: 600 }}
            >
                <ArrowBackIcon sx={{ fontSize: 16, mr: 1 }} /> Back to Store List
            </Link>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {store.name}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                    onClick={() => onEdit(store)}
                    sx={{
                        backgroundColor: '#000', textTransform: 'none', borderRadius: 2, px: 3,
                        '&:hover': { backgroundColor: '#333' }
                    }}
                >
                    Update Store
                </Button>
            </Box>

            {/* Section 1: Basic Information */}
            <Paper variant="outlined" sx={{ borderRadius: 4, p: 4, mb: 4, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Basic Information</Typography>
                    <Chip
                        label={store.status?.toUpperCase() || 'UNKNOWN'}
                        size="small"
                        sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', borderRadius: 1.5 }}
                    />
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>STORE ID</Typography>
                        <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{`ST-${store.id}`}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>ADDRESS</Typography>
                        <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{store.address}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>REGIONAL MANAGER</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography sx={{ fontWeight: 600, mr: 0.5 }}>
                                {store.managerName !== 'No Manager' ? store.managerName : 'Not Assigned'}
                            </Typography>
                            {store.managerName !== 'No Manager' && (
                                <CheckCircleIcon sx={{ fontSize: 16, color: '#000' }} />
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Section 2: Associated Employees */}
            <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Associated Employees</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {store.totalEmployees} Total Staff
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                            <TableRow>
                                {['EMPLOYEE', 'ROLE', 'DEPARTMENT', 'STATUS'].map((head) => (
                                    <TableCell key={head} sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem', py: 1.5 }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {store.employees && store.employees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                                                {getInitials(emp.fullName || emp.name)}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                                    {emp.fullName || emp.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    EMP-{emp.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#475569', fontWeight: 500 }}>
                                        {formatRole(emp.role)}
                                    </TableCell>
                                    <TableCell sx={{ color: '#475569', fontWeight: 500 }}>
                                        {emp.department || 'Operations'} {/* Tạm để Operations nếu API không có field department */}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={emp.status === 'ACTIVE' ? 'On Duty' : 'Off Shift'}
                                            size="small"
                                            sx={{
                                                borderRadius: 1, fontWeight: 700, fontSize: '0.7rem',
                                                backgroundColor: emp.status === 'ACTIVE' ? '#f1f5f9' : 'transparent',
                                                border: emp.status !== 'ACTIVE' ? '1px solid #e2e8f0' : 'none',
                                                color: '#475569'
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!store.employees || store.employees.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#64748b' }}>
                                        No employees found for this store.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Divider />
                <Box sx={{ p: 2, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        See all {store.totalEmployees} employees associated with ST-{store.id}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default StoreDetail;