import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import StoreList from '../../components/admin/StoreList'; // Chú ý sửa lại đúng đường dẫn thư mục của bạn
import StoreDetail from '../../components/admin/StoreDetail';
import AddStoreForm from '../../components/admin/AddStoreForm';
import EditStoreForm from '../../components/admin/EditStoreForm';
import storeService from "../../api/store.jsx";
import AdminSider from "../../components/admin/AdminSidebar.jsx";

const StoreManagementPage = () => {
    const [currentView, setCurrentView] = useState('list');
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);

    const fetchStores = async () => {
        try {
            const response = await storeService.getAll();
            const data = response.data || response;
            setStores(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách cửa hàng:', error);
            setStores([]);
        }
    };

    useEffect(() => {
        if (currentView === 'list') {
            fetchStores();
        }
    }, [currentView]);

    const handleViewDetail = async (id) => {
        try {
            const response = await storeService.getOne(id);
            const data = response.data || response;
            setSelectedStore(data);
            setCurrentView('detail');
        } catch (error) {
            console.error('Lỗi lấy chi tiết:', error);
        }
    };

    const handleOpenEdit = (store) => {
        setSelectedStore(store);
        setCurrentView('edit');
    };

    const handleCreateStore = async (storeData) => {
        try {
            await storeService.create(storeData);
            setCurrentView('list');
        } catch (error) {
            console.error('Lỗi khi tạo mới:', error);
        }
    };

    const handleUpdateStore = async (storeData) => {
        try {
            await storeService.update(storeData);
            setCurrentView('list');
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'detail':
                return (
                    <StoreDetail
                        store={selectedStore}
                        onBack={() => {
                            setCurrentView('list');
                            setSelectedStore(null);
                        }}
                        onEdit={handleOpenEdit}
                    />
                );
            case 'add':
                return (
                    <AddStoreForm
                        onSave={handleCreateStore}
                        onCancel={() => setCurrentView('list')}
                    />
                );
            case 'edit':
                return (
                    <EditStoreForm
                        store={selectedStore}
                        onSave={handleUpdateStore}
                        onCancel={() => {
                            setCurrentView('list');
                            setSelectedStore(null);
                        }}
                    />
                );
            case 'list':
            default:
                return (
                    <StoreList
                        stores={stores}
                        onAdd={() => setCurrentView('add')}
                        onView={handleViewDetail}
                        onEdit={handleOpenEdit}
                    />
                );
        }
    };

    return (
        <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: '#fcfcfc' }}>
            <Box sx={{ flexShrink: 0 }}>
                <AdminSider />
            </Box>
            <Box sx={{ flexGrow: 1, overflowX: 'hidden' }}>
                {renderContent()}
            </Box>
        </Box>
    );
};

export default StoreManagementPage;