import api from "./api"; // Import axios instance từ api.jsx

const EMPLOYEE_API_PATH = "/auth/employee";

const employee = {
    /**
     * Lấy thông tin cá nhân của người dùng hiện tại (đang đăng nhập)
     * Thường dùng để hiển thị tên, quyền (role) trên Header/Sidebar
     */
    getCurrentUser: async () => {
        try {
            const response = await api.get(`${EMPLOYEE_API_PATH}/me`);
            return response.data; // Trả về BaseResponse<UserProfileResponseDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Lấy chi tiết nhân viên theo ID
     * Roles: ROLE_ADMIN
     */
    getOne: async (id) => {
        try {
            const response = await api.get(`${EMPLOYEE_API_PATH}/${id}`);
            return response.data; // Trả về BaseResponse<EmployeeDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Tìm kiếm và phân trang danh sách nhân viên
     * Roles: ROLE_ADMIN
     * @param {Object} params - { keyword, role, page, size }
     */
    search: async (params) => {
        try {
            // params sẽ bao gồm: keyword, role, page, size
            // Axios sẽ tự chuyển object thành query string: ?keyword=abc&page=1...
            const response = await api.get(`${EMPLOYEE_API_PATH}/search`, { params });
            return response.data; // Trả về BaseResponse<PageDTO<EmployeeDTO>>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Tạo mới nhân viên
     * Roles: ROLE_ADMIN
     * @param {Object} employeeRequest - Dữ liệu nhân viên (username, password, fullName, role, storeId, status)
     */
    create: async (employeeRequest) => {
        try {
            const response = await api.post(`${EMPLOYEE_API_PATH}/create`, employeeRequest);
            return response.data; // Trả về BaseResponse<EmployeeDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Cập nhật thông tin nhân viên
     * Roles: ROLE_ADMIN
     * @param {Object} employeeRequest - Dữ liệu (phải bao gồm ID nếu BE yêu cầu)
     */
    update: async (employeeRequest) => {
        try {
            const response = await api.put(`${EMPLOYEE_API_PATH}/update`, employeeRequest);
            return response.data; // Trả về BaseResponse<EmployeeDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default employee;