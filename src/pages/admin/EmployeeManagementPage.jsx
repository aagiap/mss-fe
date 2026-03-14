import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import EmployeeList from '../../components/admin/EmployeeList';
import CreateEmployeeForm from '../../components/admin/CreateEmployeeForm';
import UpdateEmployeeForm from '../../components/admin/UpdateEmployeeForm.jsx';
import employeeApi from '../../api/employee';
import AdminSidebar from "../../components/admin/AdminSidebar.jsx";

const EmployeeManagementPage = () => {
    // Quản lý hiển thị: 'list', 'create', 'update'
    const [currentView, setCurrentView] = useState('list');

    // State lưu dữ liệu
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // State lưu cấu hình API tìm kiếm và phân trang
    const [filters, setFilters] = useState({
        keyword: '',
        role: 'all',
        storeId: 'all', // Thêm nếu BE hỗ trợ lọc theo store
        page: 1,
        size: 5
    });

    // Gọi API lấy danh sách
    const fetchEmployees = async () => {
        try {
            // Xóa các param bằng 'all' để không gửi lên server nếu BE không yêu cầu
            const apiParams = { ...filters };
            if (apiParams.role === 'all') delete apiParams.role;
            if (apiParams.storeId === 'all') delete apiParams.storeId;

            const response = await employeeApi.search(apiParams);
            const data = response.data || response;

            // Giả định BE trả về cấu trúc Page (content, totalElements, totalPages)
            setEmployees(data.content || []);
            setTotalElements(data.totalElements || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
        }
    };

    // Theo dõi sự thay đổi của filters để call API
    useEffect(() => {
        if (currentView === 'list') {
            fetchEmployees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentView]);

    // ---- CÁC HÀM XỬ LÝ SỰ KIỆN ----
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleCreateEmployee = async (employeeData) => {
        try {
            await employeeApi.create(employeeData);
            setCurrentView('list');
        } catch (error) {
            console.error('Lỗi khi tạo nhân viên:', error);
        }
    };

    const handleUpdateEmployee = async (employeeData) => {
        try {
            await employeeApi.update(employeeData);
            setCurrentView('list');
        } catch (error) {
            console.error('Lỗi khi cập nhật:', error);
        }
    };

    const handleToggleStatus = async (employeeRow) => {
        try {
            const newStatus = employeeRow.status === 'Active' ? 'Inactive' : 'Active';
            // Cập nhật lên BE
            await employeeApi.update({ ...employeeRow, status: newStatus });
            // Cập nhật lại list ngay lập tức
            fetchEmployees();
        } catch (error) {
            console.error('Lỗi khi đổi trạng thái:', error);
        }
    };

    // ---- RENDER NỘI DUNG ----
    const renderContent = () => {
        switch (currentView) {
            case 'create':
                return (
                    <CreateEmployeeForm
                        onSave={handleCreateEmployee}
                        onCancel={() => setCurrentView('list')}
                    />
                );
            case 'update':
                return (
                    <UpdateEmployeeForm
                        employee={selectedEmployee}
                        onSave={handleUpdateEmployee}
                        onCancel={() => setCurrentView('list')}
                    />
                );
            case 'list':
            default:
                return (
                    <EmployeeList
                        employees={employees}
                        filters={filters}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        onFilterChange={handleFilterChange}
                        onAdd={() => setCurrentView('create')}
                        onEdit={(emp) => {
                            setSelectedEmployee(emp);
                            setCurrentView('update');
                        }}
                        onToggleStatus={handleToggleStatus}
                    />
                );
        }
    };

    return (
        <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: '#fcfcfc' }}>
            <Box sx={{ flexShrink: 0 }}>
                <AdminSidebar />
            </Box>
            <Box sx={{ flexGrow: 1, overflowX: 'hidden' }}>
                {renderContent()}
            </Box>
        </Box>
    );
};

export default EmployeeManagementPage;