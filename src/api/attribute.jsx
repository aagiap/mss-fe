import api from "./api";

// ✅ Backend @RequestMapping("/product/attribute")
const ATTRIBUTE_API_PATH = "/product/attribute";

const attributeApi = {
    /**
     * Lấy danh sách thuộc tính
     * Backend nhận: search, page, size
     * Backend trả: BaseResponse<Page<ProductAttribute>>
     * ProductAttribute: { id, productId, attributeName, attributeValue }
     */
    getAll: async (params) => {
        try {
            const response = await api.get(ATTRIBUTE_API_PATH, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Tạo mới thuộc tính
     * Backend nhận: AttributeRequest { productId (Long), attributeName, attributeValue }
     */
    create: async (attributeRequest) => {
        try {
            const response = await api.post(ATTRIBUTE_API_PATH, attributeRequest);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Cập nhật thuộc tính
     */
    update: async (id, attributeRequest) => {
        try {
            const response = await api.put(`${ATTRIBUTE_API_PATH}/${id}`, attributeRequest);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Xóa thuộc tính
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${ATTRIBUTE_API_PATH}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default attributeApi;