import React from 'react';
import {
    Box, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip,
    IconButton, Pagination, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const getStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
        case 'ACTIVE':
        case 'ACTIVE / OPEN':
            return { color: '#2e7d32', bgColor: '#e8f5e9' };
        case 'INACTIVE':
        case 'CLOSED':
            return { color: '#757575', bgColor: '#f5f5f5' };
        case 'PENDING':
        case 'UNDER RENOVATION':
            return { color: '#ed6c02', bgColor: '#fff3e0' };
        default:
            return { color: '#475569', bgColor: '#f1f5f9' };
    }
};

const StoreList = ({ stores = [], onAdd, onView, onEdit }) => {
    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Store Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                        Manage and monitor your retail locations globally.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    sx={{
                        backgroundColor: '#0f172a',
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        '&:hover': { backgroundColor: '#1e293b' }
                    }}
                >
                    Create New Store
                </Button>
            </Box>

            {/* Table Section */}
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            {['ID', 'STORE NAME', 'ADDRESS', 'STATUS', 'ACTIONS'].map((head) => (
                                <TableCell key={head} sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', py: 2 }}>
                                    {head}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stores.length > 0 ? (
                            stores.map((row) => {
                                const { color, bgColor } = getStatusStyles(row.status);
                                return (
                                    <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ color: '#64748b' }}>ST-{row.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.name}</TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>{row.address}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status}
                                                size="small"
                                                sx={{ fontWeight: 700, color: color, backgroundColor: bgColor, borderRadius: 1.5 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton size="small" sx={{ mr: 1, color: '#94a3b8' }} onClick={() => onView(row.id)}>
                                                <VisibilityOutlinedIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={() => onEdit(row)}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                        No stores found in the database.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Section (Hiển thị nếu có dữ liệu) */}
            {stores.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Total {stores.length} stores
                    </Typography>
                    <Stack spacing={2}>
                        <Pagination
                            count={1} // Giả lập 1 trang nếu BE chưa hỗ trợ Pagination cho Store
                            shape="rounded"
                            size="small"
                            renderItem={(item) => (
                                <Box
                                    {...item}
                                    component={Button}
                                    sx={{
                                        minWidth: 32, height: 32, p: 0, borderRadius: 1,
                                        backgroundColor: item.selected ? '#0f172a !important' : 'transparent',
                                        color: item.selected ? '#fff !important' : '#64748b',
                                        '&:hover': { backgroundColor: '#f1f5f9' }
                                    }}
                                />
                            )}
                        />
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default StoreList;