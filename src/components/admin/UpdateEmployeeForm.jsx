import React, { useState } from 'react';
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

const UpdateEmployeeForm = () => {
    const [status, setStatus] = useState('Active');

    return (
        <Box sx={{ p: 4, backgroundColor: '#fcfcfc', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 850 }}>

                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#000' }}>
                        Update Employee: John Doe
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
                                defaultValue="jdoe_admin"
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
                                defaultValue="John Doe"
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
                                defaultValue="westside"
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="westside">Westside Mall Branch</MenuItem>
                                <MenuItem value="downtown">Downtown Flagship</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Role */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Role</Typography>
                            <TextField
                                select
                                fullWidth
                                defaultValue="manager"
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="manager">Store Manager</MenuItem>
                                <MenuItem value="admin">Administrator</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Employment Status */}
                        <Grid item xs={12}>
                            <Typography sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Employment Status</Typography>
                            <RadioGroup
                                row
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <FormControlLabel
                                    value="Active"
                                    control={<Radio sx={{ color: '#000', '&.Mui-checked': { color: '#000' } }} />}
                                    label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Active</Typography>}
                                />
                                <FormControlLabel
                                    value="Inactive"
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