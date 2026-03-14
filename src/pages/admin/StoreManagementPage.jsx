import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import StoreList from '../../components/admin/StoreList';
import StoreDetail from '../../components/admin/StoreDetail';
import AddStoreForm from '../../components/admin/AddStoreForm';
import EditStoreForm from '../../components/admin/EditStoreForm';
import storeService from "../../api/store.jsx";
import AdminSider from "../../components/admin/AdminSidebar.jsx";

const StoreManagementPage = () => {
    // view có thể là: 'list', 'detail', 'add', 'edit'
    const [currentView, setCurrentView] = useState('list');
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);

    // Fetch dữ liệu khi load màn hình
    const fetchStores = async () => {
        try {
            const response = await storeService.getAll();
            // Tùy thuộc cấu trúc BE trả về, có thể là response.data hoặc response
            const data = response.data || response;
            setStores(data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách cửa hàng:', error);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    // -------- CÁC HÀM ĐIỀU HƯỚNG MÀN HÌNH --------
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

    // -------- CÁC HÀM GỌI API THAY ĐỔI DỮ LIỆU --------
    const handleCreateStore = async (storeData) => {
        try {
            await storeService.create(storeData);
            await fetchStores(); // Refresh lại danh sách
            setCurrentView('list');
        } catch (error) {
            console.error('Lỗi khi tạo mới:', error);
        }
    };

    const handleUpdateStore = async (storeData) => {
        try {
            await storeService.update(storeData);
            await fetchStores(); // Refresh lại danh sách
            setCurrentView('list');
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
        }
    };

    // Render component dựa theo state currentView
    const renderContent = () => {
        switch (currentView) {
            case 'detail':
                return (
                    <StoreDetail
                        store={selectedStore}
                        onBack={() => setCurrentView('list')}
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
                        onCancel={() => setCurrentView('list')}
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
            {/* Sidebar bên trái */}
            <Box sx={{ flexShrink: 0 }}>
                <AdminSider />
            </Box>

            {/* Nội dung bên phải sẽ thay đổi linh hoạt */}
            <Box sx={{ flexGrow: 1, overflowX: 'hidden' }}>
                {renderContent()}
            </Box>
        </Box>
    );
};

export default StoreManagementPage;