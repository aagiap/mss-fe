import api from "./api";

// ✅ Backend @RequestMapping("/product/category")
const CATEGORY_API_PATH = "/product/category";

const categoryApi = {
    /**
     * Lấy danh sách danh mục (có phân trang và tìm kiếm)
     * Backend nhận: search, page, size
     * Backend trả: BaseResponse<Page<Category>>
     */
    getAll: async (params) => {
        try {
            const response = await api.get(CATEGORY_API_PATH, { params });
            return response.data; // BaseResponse { data: Page<Category> }
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Tạo mới danh mục
     * Backend nhận: CategoryRequest { name, description }
     * Backend trả: BaseResponse<Category>
     */
    create: async (categoryRequest) => {
        try {
            const response = await api.post(CATEGORY_API_PATH, categoryRequest);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Cập nhật danh mục
     * Backend nhận: CategoryRequest { name, description }
     */
    update: async (id, categoryRequest) => {
        try {
            const response = await api.put(`${CATEGORY_API_PATH}/${id}`, categoryRequest);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Xóa danh mục
     * Backend sẽ throw RuntimeException nếu category đang có product
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${CATEGORY_API_PATH}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default categoryApi;