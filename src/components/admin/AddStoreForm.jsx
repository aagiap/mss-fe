// AddStoreForm.jsx
import React, { useState } from 'react';
import { Box, TextField, Typography, Button, MenuItem, IconButton, Paper, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';

const AddStoreForm = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState('Active');

    const handleSubmit = () => {
        onSave({ name, address, status });
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f7f9' }}>
            <Paper elevation={3} sx={{ width: 450, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Add New Store</Typography>
                    <IconButton size="small" onClick={onCancel}><CloseIcon fontSize="small" /></IconButton>
                </Box>
                <Divider />
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.9rem' }}>Store Name</Typography>
                        <TextField fullWidth value={name} onChange={e => setName(e.target.value)} size="small" />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.9rem' }}>Address</Typography>
                        <TextField fullWidth multiline rows={3} value={address} onChange={e => setAddress(e.target.value)} />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.9rem' }}>Status</Typography>
                        <TextField select fullWidth value={status} onChange={(e) => setStatus(e.target.value)} size="small">
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                        </TextField>
                    </Box>
                </Box>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, backgroundColor: '#fafafa' }}>
                    <Button onClick={onCancel} sx={{ color: '#5f6368', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} startIcon={<StorefrontIcon />} sx={{ backgroundColor: '#000', color: '#fff' }}>Create Store</Button>
                </Box>
            </Paper>
        </Box>
    );
};
export default AddStoreForm;