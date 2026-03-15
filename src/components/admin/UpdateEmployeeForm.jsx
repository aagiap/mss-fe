import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Button,
    Paper,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    InputAdornment,
    Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

const UpdateEmployeeForm = ({ employee, onSave, onCancel, stores = []}) => {
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        id: '',
        fullName: '',
        username: '',
        storeId: '',
        role: '',
        status: 'Active'
    });

    // Khi component render hoặc biến employee thay đổi, nạp dữ liệu vào form
    useEffect(() => {
        if (employee) {
            setFormData({
                id: employee.id,
                fullName: employee.fullName || employee.name || '',
                username: employee.username || '',
                storeId: employee.storeId || '',
                role: employee.role || '',
                status: employee.status || 'Active'
            });
        }
    }, [employee]);

    // Hàm cập nhật dữ liệu khi người dùng nhập
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý khi nhấn Update
    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 850 }}>

                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#000' }}>
                        Update Employee: {formData.fullName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                        Modify staff details, roles, and status within the organization.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #f1f5f9' }}>
                    {/* Section Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
                        <PersonIcon sx={{ fontSize: 22, color: '#000' }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Personal Information
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {/* Username - Disabled Field */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Username</Typography>
                            <TextField
                                fullWidth
                                disabled
                                value={formData.username} // Binding dữ liệu
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ fontSize: 16 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8fafc' },
                                    '& .Mui-disabled': { WebkitTextFillColor: '#94a3b8' }
                                }}
                            />
                            <Typography variant="caption" sx={{ color: '#cbd5e1', mt: 0.5, display: 'block' }}>
                                Username cannot be changed once created.
                            </Typography>
                        </Grid>

                        {/* Full Name */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Full Name</Typography>
                            <TextField
                                fullWidth
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        {/* Assigned Store */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Assigned Store</Typography>
                            <TextField
                                select
                                fullWidth
                                name="storeId"
                                value={formData.storeId}
                                onChange={handleChange}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="">Select a store</MenuItem>
                                {stores.map((store) => (
                                    <MenuItem key={store.id} value={store.id}>
                                        ST-{store.id} | {store.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Role */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Role</Typography>
                            <TextField
                                select
                                fullWidth
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="">Select a role</MenuItem>
                                <MenuItem value="ROLE_MANAGER">Store Manager</MenuItem>
                                <MenuItem value="ROLE_CASHIER">CASHIER</MenuItem>
                                <MenuItem value="ROLE_STAFF">Staff</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Employment Status */}
                        <Grid item xs={12}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Employment Status</Typography>
                            <RadioGroup
                                row
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <FormControlLabel
                                    value="ACTIVE"
                                    control={<Radio sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }} />}
                                    label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Active</Typography>}
                                />
                                <FormControlLabel
                                    value="INACTIVE"
                                    control={<Radio sx={{ color: '#ccc', '&.Mui-checked': { color: '#ccc' } }} />}
                                    label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#94a3b8' }}>Inactive</Typography>}
                                />
                            </RadioGroup>
                        </Grid>
                    </Grid>

                    {/* Footer Buttons */}
                    <Stack direction="row" spacing={2} sx={{ mt: 6, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={onCancel} // Gắn sự kiện Cancel
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 4,
                                color: '#475569',
                                borderColor: '#e2e8f0',
                                fontWeight: 700,
                                '&:hover': { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit} // Gắn sự kiện Update
                            sx={{
                                backgroundColor: '#f1f5f9',
                                color: '#000',
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 4,
                                fontWeight: 700,
                                boxShadow: 'none',
                                '&:hover': { backgroundColor: '#e2e8f0', boxShadow: 'none' }
                            }}
                        >
                            Update Changes
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
};

export default UpdateEmployeeForm;