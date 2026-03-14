import React from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Pagination, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const getStatusStyles = (status) => {
    switch (status) {
        case 'Active':
        case 'Active / Open':
            return { color: '#2e7d32', bgColor: '#e8f5e9' };
        case 'Inactive':
        case 'Closed':
            return { color: '#757575', bgColor: '#f5f5f5' };
        case 'Pending':
        case 'Under Renovation':
            return { color: '#ed6c02', bgColor: '#fff3e0' };
        default:
            return { color: '#000', bgColor: '#eee' };
    }
};

const StoreList = ({ stores, onAdd, onView, onEdit }) => {
    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>Store Management</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>Manage and monitor your retail locations globally.</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    sx={{ backgroundColor: '#0f172a', textTransform: 'none', borderRadius: 2, px: 3, py: 1, '&:hover': { backgroundColor: '#1e293b' } }}
                >
                    Create New Store
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            {['ID', 'STORE NAME', 'ADDRESS', 'STATUS', 'ACTIONS'].map((head) => (
                                <TableCell key={head} sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', py: 2 }}>{head}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stores.map((row) => {
                            const { color, bgColor } = getStatusStyles(row.status);
                            return (
                                <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ color: '#64748b' }}>{row.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.name}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{row.address}</TableCell>
                                    <TableCell>
                                        <Chip label={row.status} size="small" sx={{ fontWeight: 700, color: color, backgroundColor: bgColor, borderRadius: 1.5 }} />
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
                        })}
                        {stores.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748b' }}>Không có dữ liệu</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default StoreList;