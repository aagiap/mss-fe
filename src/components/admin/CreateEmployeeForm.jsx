import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Button,
    Paper,
    Grid,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel,
    InputAdornment,
    IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import KeyIcon from '@mui/icons-material/Key';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';

const CreateEmployeeForm = ({ onSave, onCancel, stores = []}) => {
    // State lưu toàn bộ dữ liệu form
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        storeId: '',
        role: '',
        status: 'Active'
    });

    // State ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);

    // Hàm cập nhật dữ liệu khi người dùng nhập
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý khi nhấn Save
    const handleSubmit = () => {
        onSave(formData);
    };

    // Style chung cho tiêu đề các Section
    const SectionHeader = ({ icon: Icon, title }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Icon sx={{ fontSize: 20, color: '#000' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {title}
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 800 }}>
                {/* Header chính */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#000' }}>
                        Create New Employee
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                        Add a new staff member to the system and assign roles.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #f1f5f9' }}>
                    {/* Section 1: Personal Info */}
                    <SectionHeader icon={PersonIcon} title="Personal Info" />
                    <Box sx={{ mb: 4 }}>
                        <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Full Name</Typography>
                        <TextField
                            fullWidth
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="e.g. Jonathan Smith"
                            size="small"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff' } }}
                        />
                    </Box>
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

                    {/* Section 2: Account Info */}
                    <SectionHeader icon={KeyIcon} title="Account Info" />
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Username</Typography>
                            <TextField
                                fullWidth
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="jsmith24"
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Password</Typography>
                            <TextField
                                fullWidth
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="........"
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

                    {/* Section 3: Assignment */}
                    <SectionHeader icon={AssignmentIcon} title="Assignment" />
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Store Location</Typography>
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
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>System Role</Typography>
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
                                <MenuItem value="ROLE_MANAGER">Manager</MenuItem>
                                <MenuItem value="ROLE_STAFF">Staff</MenuItem>
                                <MenuItem value="ROLE_ADMIN">Administrator</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

                    {/* Section 4: Status */}
                    <SectionHeader icon={ToggleOnIcon} title="Status" />
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
                            control={<Radio sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }} />}
                            label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Inactive</Typography>}
                        />
                    </RadioGroup>
                </Paper>

                {/* Footer Buttons */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
                    <Button
                        onClick={onCancel} // Đã thêm onCancel
                        sx={{ color: '#000', textTransform: 'none', fontWeight: 700 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit} // Đã thêm handleSubmit
                        startIcon={<SaveIcon />}
                        sx={{
                            backgroundColor: '#000',
                            color: '#fff',
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 4,
                            py: 1,
                            fontWeight: 700,
                            '&:hover': { backgroundColor: '#333' }
                        }}
                    >
                        Save Employee
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default CreateEmployeeForm;