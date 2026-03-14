import React from 'react';
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

const employees = [
    { id: '101', name: 'John Doe', username: 'jdoe88', store: 'Downtown Hub', role: 'Manager', status: 'Active', initials: 'JD' },
    { id: '102', name: 'Jane Smith', username: 'jsmith22', store: 'North Mall', role: 'Staff', status: 'Active', initials: 'JS' },
    { id: '103', name: 'Robert Brown', username: 'rbrown90', store: 'West Side', role: 'Staff', status: 'Inactive', initials: 'RB' },
    { id: '104', name: 'Emily Davis', username: 'edavis_x', store: 'Downtown Hub', role: 'Supervisor', status: 'Active', initials: 'ED' },
    { id: '105', name: 'Michael Wilson', username: 'mwilson_retail', store: 'East Gate', role: 'Staff', status: 'Active', initials: 'MW' },
];

const EmployeeList = () => {
    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh' }}>

            {/* Header */}
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
                            placeholder="Search by name or ID..."
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
                            defaultValue="all"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="all">All Stores</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Role</Typography>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            defaultValue="all"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><WorkOutlineIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                            <MenuItem value="all">All Roles</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<FilterListOffIcon />}
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
                        {employees.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{row.id}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }}>{row.initials}</Avatar>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>{row.username}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.store}</Typography>
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
                                    <IconButton size="small" sx={{ color: '#94a3b8', mr: 1 }}><EditOutlinedIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" sx={{ color: '#94a3b8' }}>
                                        {row.status === 'Active' ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>Showing 1 to 5 of 42 employees</Typography>
                <Pagination
                    count={9}
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
        </Box>
    );
};

export default EmployeeList;