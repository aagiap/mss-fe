// EditStoreForm.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Paper, Stack } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const EditStoreForm = ({ store, onSave, onCancel }) => {
    const [name, setName] = useState(store?.name || '');
    const [address, setAddress] = useState(store?.address || '');
    const [status, setStatus] = useState(store?.status || 'Active / Open');

    const handleSubmit = () => {
        onSave({ id: store.id, name, address, status });
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', p: 2 }}>
            <Paper elevation={0} sx={{ width: '100%', maxWidth: 500, p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>Edit Store Information</Typography>
                </Box>
                <Stack spacing={3}>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Store Name</Typography>
                        <TextField fullWidth value={name} onChange={e => setName(e.target.value)} />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Store Address</Typography>
                        <TextField fullWidth multiline rows={4} value={address} onChange={e => setAddress(e.target.value)} />
                    </Box>
                    <Box>
                        <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem' }}>Store Status</Typography>
                        <TextField select fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="Active / Open">Active / Open</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                            <MenuItem value="Under Renovation">Under Renovation</MenuItem>
                        </TextField>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
                    <Button fullWidth variant="contained" onClick={handleSubmit} startIcon={<CheckCircleOutlineIcon />} sx={{ backgroundColor: '#0f172a' }}>Save Changes</Button>
                    <Button fullWidth variant="contained" onClick={onCancel} sx={{ backgroundColor: '#f1f5f9', color: '#475569', boxShadow: 'none' }}>Cancel</Button>
                </Stack>
            </Paper>
        </Box>
    );
};
export default EditStoreForm;