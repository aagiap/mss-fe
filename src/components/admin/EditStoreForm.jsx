import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Paper, Stack } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const EditStoreForm = ({ store, onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState('ACTIVE');

    // Nạp dữ liệu khi mở form
    useEffect(() => {
        if (store) {
            setName(store.name || '');
            setAddress(store.address || '');
            setStatus(store.status || 'ACTIVE');
        }
    }, [store]);

    const handleSubmit = () => {
        onSave({ id: store.id, name, address, status });
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', p: 2 }}>
            <Paper elevation={0} sx={{ width: '100%', maxWidth: 500, p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>Edit Store Information</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Update your business profile and operational status.</Typography>
                </Box>
                <Stack spacing={3}>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Store Name</Typography>
                        <TextField fullWidth value={name} onChange={e => setName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Store Address</Typography>
                        <TextField fullWidth multiline rows={4} value={address} onChange={e => setAddress(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Store Status</Typography>
                        <TextField select fullWidth value={status} onChange={(e) => setStatus(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
                            <MenuItem value="ACTIVE">Active</MenuItem>
                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                        </TextField>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
                    <Button fullWidth variant="contained" onClick={handleSubmit} startIcon={<CheckCircleOutlineIcon />} sx={{ backgroundColor: '#0f172a', textTransform: 'none', borderRadius: 2.5, py: 1.5, fontWeight: 700 }}>
                        Save Changes
                    </Button>
                    <Button fullWidth variant="contained" onClick={onCancel} sx={{ backgroundColor: '#f1f5f9', color: '#475569', textTransform: 'none', borderRadius: 2.5, py: 1.5, fontWeight: 700, boxShadow: 'none' }}>
                        Cancel
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default EditStoreForm;