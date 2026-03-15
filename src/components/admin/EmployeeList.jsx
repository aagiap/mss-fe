import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Chip,
    IconButton,
    Pagination,
    InputAdornment,
    Grid
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LaunchIcon from '@mui/icons-material/Launch';

const EmployeeList = ({
                          employees = [],
                          stores = [],// Mặc định là mảng rỗng nếu không có dữ liệu
                          onAdd,
                          onEdit,
                          onToggleStatus,
                          filters,
                          onFilterChange,
                          totalPages = 1,
                          totalElements = 0
                      }) => {
    const [localKeyword, setLocalKeyword] = useState(filters?.keyword || '');

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            onFilterChange({ ...filters, keyword: localKeyword, page: 1 });
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#000' }}>Employee Management</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                        Manage your retail staff across all store locations
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAddAlt1Icon />}
                    onClick={onAdd}
                    sx={{ backgroundColor: '#000', textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, py: 1 }}
                >
                    Create New Employee
                </Button>
            </Box>

            {/* Filter Bar */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 4, border: '1px solid #f1f5f9' }}>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} md={4}>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Name or ID</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Press Enter to search..."
                            value={localKeyword}
                            onChange={(e) => setLocalKeyword(e.target.value)}
                            onKeyDown={handleSearch}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Store Location</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={filters?.storeId || 'all'}
                            onChange={(e) => onFilterChange({ ...filters, storeId: e.target.value, page: 1 })}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="all">All Stores</MenuItem>
                            {stores.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                    ST-{store.id} | {store.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Role</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={filters?.role || 'all'}
                            onChange={(e) => onFilterChange({ ...filters, role: e.target.value, page: 1 })}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><WorkOutlineIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="all">All Roles</MenuItem>
                            <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                            <MenuItem value="ROLE_MANAGER">Manager</MenuItem>
                            <MenuItem value="ROLE_STAFF">Staff</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<FilterListOffIcon />}
                            onClick={() => {
                                setLocalKeyword('');
                                onFilterChange({ keyword: '', role: 'all', storeId: 'all', page: 1 });
                            }}
                            sx={{ backgroundColor: '#f1f5f9', color: '#64748b', textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none', height: 40 }}
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Employee Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, border: '1px solid #f1f5f9' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            {['ID', 'FULL NAME', 'USERNAME', 'STORE', 'ROLE', 'STATUS', 'ACTIONS'].map((text) => (
                                <TableCell key={text} sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>{text}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.length > 0 ? (
                            employees.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{row.id}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                                                {getInitials(row.fullName || row.name)}
                                            </Avatar>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.fullName || row.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{row.username}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.storeName || 'N/A'}</Typography>
                                            <IconButton size="small"><LaunchIcon sx={{ fontSize: 14, color: '#94a3b8' }} /></IconButton>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#475569', fontSize: '0.875rem' }}>{row.role}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.status}
                                            size="small"
                                            sx={{
                                                backgroundColor: row.status === 'Active' ? '#000' : '#f1f5f9',
                                                color: row.status === 'Active' ? '#fff' : '#94a3b8',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                borderRadius: 1.5
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" sx={{ color: '#94a3b8', mr: 1 }} onClick={() => onEdit(row)}>
                                            <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={() => onToggleStatus(row)}>
                                            {row.status === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                    <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                        No employees found in the database.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {employees.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                        Total {totalElements} employees
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={filters?.page || 1}
                        onChange={(e, p) => onFilterChange({ ...filters, page: p })}
                        shape="rounded"
                        size="small"
                        renderItem={(item) => (
                            <Box
                                {...item}
                                component={Button}
                                sx={{
                                    minWidth: 32, height: 32, p: 0, borderRadius: 1.5,
                                    backgroundColor: item.selected ? '#000 !important' : 'transparent',
                                    color: item.selected ? '#fff !important' : '#64748b',
                                    fontWeight: 700
                                }}
                            />
                        )}
                    />
                </Box>
            )}
        </Box>
    );
};

export default EmployeeList;