import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Modal,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Pagination,
  OverlayTrigger,
  Tooltip,
  ProgressBar,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import customerApi from "../../api/customer";
import {
  Search,
  UserPlus,
  UserCircle,
  History,
  Edit3,
  ArrowLeft,
  Save,
  X,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  TrendingUp,
  Award,
  ChevronRight,
  MoreVertical,
  PlusCircle,
  Coins,
} from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import CustomerDetailView from "./CustomerDetail";

// Ngưỡng VIP và tỷ lệ tích điểm theo SRS
const VIP_THRESHOLD = 1000;
const POINT_RATE = 10000; // 10.000 VNĐ = 1 điểm
const PAGE_SIZE = 5; // Số lượng khách hàng hiển thị mỗi trang

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerApi.getAll({ page: 0, size: 200 });

      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.data && Array.isArray(response.data)) {
        data = response.data;
      }

      // 🔥 SORT: mới nhất lên đầu (giả sử có id tăng dần)
      data.sort((a, b) => b.id - a.id);

      setCustomers(data);
    } catch (error) {
      setError(error?.message || "Không thể tải dữ liệu khách hàng");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCustomers();
  }, []);

  const [modalMode, setModalMode] = useState("create");
  const [selectedCust, setSelectedCust] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("ALL");

  const handleApplyFilter = () => {
    setAppliedSearch(searchTerm);
    setAppliedFilter(filterType);
    setCurrentPage(1); // reset trang
  };

  const handleSearchByPhone = async () => {
    try {
      setLoading(true);
      const res = await customerApi.findByPhone(searchTerm);

      if (res?.data) {
        setCustomers([res.data]);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSaveCustomer = async (customerPayload) => {
    try {
      setLoading(true);
      setError(null);

      if (modalMode === "create") {
        await customerApi.create(customerPayload);
        setToastMsg("Tạo khách hàng thành công!");
      } else if (modalMode === "edit" && selectedCust) {
        await customerApi.update(selectedCust.id, customerPayload);
        setToastMsg("Cập nhật khách hàng thành công!");
      }

      setShowToast(true);
      setShowModal(false);
      setSelectedCust(null);

      // 🔥 QUAN TRỌNG: reload data từ BE
      await fetchCustomers();
    } catch (error) {
      setError(error?.message || "Lưu khách hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (appliedFilter !== "ALL") {
      result = result.filter((c) => c.type === appliedFilter);
    }

    const normalizedSearch = appliedSearch.trim().toLowerCase();
    if (normalizedSearch) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(normalizedSearch) ||
          c.phone.includes(normalizedSearch),
      );
    }

    return result;
  }, [customers, appliedSearch, appliedFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );

  const pagedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenModal = (mode, customer = null) => {
    setModalMode(mode);
    setSelectedCust(customer);
    setShowModal(true);
  };

  const handleOpenPointModal = (customer) => {
    setSelectedCust(customer);
    setShowPointModal(true);
  };

  const handleViewDetail = async (customer) => {
    try {
      setLoading(true);

      const res = await customerApi.getById(customer.id);

      const fullCustomer = res?.data || res;

      setSelectedCust(fullCustomer);
      setView("detail");
    } catch (error) {
      setError("Không thể tải chi tiết khách hàng");
    } finally {
      setLoading(false);
    }
  };
  const processPoints = async (amount) => {
    const earnedPoints = Math.floor(amount / POINT_RATE);
    if (earnedPoints <= 0) return;

    try {
      setLoading(true);

      await customerApi.addPoints(selectedCust.id, earnedPoints);

      await fetchCustomers();

      setShowPointModal(false);
      setToastMsg(`Đã tích thêm ${earnedPoints} điểm cho khách hàng!`);
      setShowToast(true);
    } catch (error) {
      setError(error?.message || "Cộng điểm thất bại");
    } finally {
      setLoading(false);
    }
  };
  const processDeductPoints = async (amount) => {
    const deductedPoints = Math.floor(amount / POINT_RATE);
    if (deductedPoints <= 0) return;

    try {
      setLoading(true);

      await customerApi.dedauctPoints(selectedCust.id, deductedPoints);

      await fetchCustomers();

      setShowPointModal(false);
      setToastMsg(`Đã trừ ${deductedPoints} điểm của khách hàng!`);
      setShowToast(true);
    } catch (error) {
      setError(error?.message || "Trừ điểm thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="py-4 px-lg-5"
      style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}
    >
      <style>{`
        .custom-card { border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .table-row:hover { background-color: #f8f9ff !important; cursor: pointer; }
        .btn-primary { background: linear-gradient(135deg, #0d6efd 0%, #004dc7 100%); border: none; border-radius: 10px; }
        .btn-success-gradient { background: linear-gradient(135deg, #198754 0%, #146c43 100%); border: none; color: white; border-radius: 10px; }
        .badge-vip { background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%); color: #fff; }
        .nav-tabs .nav-link { border: none; color: #6c757d; font-weight: 600; padding: 12px 20px; border-bottom: 2px solid transparent; }
        .nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 2px solid #0d6efd; background: transparent; }
        .avatar-circle { background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%); color: #495057; font-weight: 700; }
        .x-small { font-size: 0.7rem; }
      `}</style>

      {/* Thông báo Toast */}
      <ToastContainer position="bottom-center" className="p-3">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          bg="dark"
          className="text-white border-0 rounded-3"
        >
          <Toast.Body className="d-flex align-items-center gap-2">
            <Award size={18} className="text-warning" /> {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* HEADER SECTION */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2 text-primary">
            <UserCircle size={32} />
            {view === "list" ? "Hệ thống Khách hàng" : "Hồ sơ Thành viên"}
          </h2>
          <div className="text-muted d-flex align-items-center gap-2 small">
            <TrendingUp size={14} />
            <span>Cập nhật: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          {view === "list" ? (
            <Button
              variant="primary"
              className="d-flex align-items-center gap-2 shadow py-2 px-4 shadow-sm fw-bold"
              onClick={() => handleOpenModal("create")}
            >
              <UserPlus size={18} />
              <span>Đăng ký mới</span>
            </Button>
          ) : (
            <div className="d-flex gap-2">
              <Button
                variant="success"
                className="btn-success-gradient d-flex align-items-center gap-2 py-2 px-3 fw-bold shadow-sm"
                onClick={() => handleOpenPointModal(selectedCust)}
              >
                <PlusCircle size={18} />
                <span>Tích điểm nhanh</span>
              </Button>
              <Button
                variant="white"
                className="bg-white border shadow-sm d-flex align-items-center gap-2 py-2 px-3 fw-bold"
                onClick={() => setView("list")}
              >
                <ArrowLeft size={18} />
                <span>Quay lại</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-4"
          role="alert"
        >
          <strong>⚠️ Lỗi:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {view === "list" ? (
        loading ? (
          <div className="text-center py-5">
            <ProgressBar animated now={100} />
            <p>Đang tải...</p>
          </div>
        ) : (
          <>
            {/* STATS OVERVIEW */}
            <Row className="mb-4 g-3 text-center text-md-start">
              <Col md={4}>
                <Card className="custom-card p-3 d-flex flex-row align-items-center gap-3">
                  <div className="p-3 bg-primary bg-opacity-10 rounded-3 text-primary">
                    <UserCircle />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">
                      Tổng khách hàng
                    </h6>
                    <h4 className="fw-bold mb-0">{customers.length}</h4>
                  </div>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="custom-card p-3 d-flex flex-row align-items-center gap-3">
                  <div className="p-3 bg-warning bg-opacity-10 rounded-3 text-warning">
                    <Star />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">
                      Thành viên VIP
                    </h6>
                    <h4 className="fw-bold mb-0">
                      {customers.filter((c) => c.type === "VIP").length}
                    </h4>
                  </div>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="custom-card p-3 d-flex flex-row align-items-center gap-3">
                  <div className="p-3 bg-success bg-opacity-10 rounded-3 text-success">
                    <Coins />
                  </div>
                  <div>
                    <h6 className="text-muted mb-0 small uppercase fw-bold">
                      Điểm đang lưu thông
                    </h6>
                    <h4 className="fw-bold mb-0">
                      {customers
                        .reduce((acc, c) => acc + c.points, 0)
                        .toLocaleString()}
                    </h4>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* SEARCH & TABLE */}
            <Card className="custom-card overflow-hidden">
              <Card.Header className="bg-white border-0 p-4">
                <Row className="align-items-center g-3">
                  <Col lg={5}>
                    <InputGroup className="shadow-sm rounded-3">
                      <InputGroup.Text className="bg-white border-end-0">
                        <Search size={16} className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Tìm theo tên hoặc số điện thoại..."
                        className="border-start-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>

                  {/* FILTER TYPE */}
                  <Col lg={3}>
                    <Form.Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="shadow-sm rounded-3 fw-semibold"
                    >
                      <option value="ALL"> Tất cả khách</option>
                      <option value="NORMAL"> Normal</option>
                      <option value="VIP"> VIP</option>
                    </Form.Select>
                  </Col>

                  {/* ACTION BUTTONS */}
                  <Col lg={4} className="d-flex gap-2 justify-content-lg-end">
                    <Button
                      variant="primary"
                      className="d-flex align-items-center gap-2 px-3 fw-semibold shadow-sm"
                      onClick={handleApplyFilter}
                    >
                      <Filter size={16} />
                      Lọc
                    </Button>

                    <Button
                      variant="light"
                      className="border shadow-sm fw-semibold"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("ALL");
                        setAppliedSearch("");
                        setAppliedFilter("ALL");
                        fetchCustomers();
                      }}
                    >
                      Reset
                    </Button>
                  </Col>
                </Row>
              </Card.Header>
              <Table responsive className="mb-0 align-middle border-0">
                <thead className="bg-light text-muted small text-uppercase fw-bold">
                  <tr>
                    <th className="ps-4 py-3">Khách hàng</th>
                    <th className="py-3">Hạng</th>
                    <th className="py-3">Điểm tích lũy</th>
                    <th className="py-3">Số Điện Thoại</th>
                    <th className="pe-4 py-3 text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCustomers.length > 0 ? (
                    pagedCustomers.map((cust) => (
                      <tr
                        key={cust.id}
                        className="table-row border-bottom border-light"
                      >
                        <td
                          className="ps-4 py-3"
                          onClick={() => handleViewDetail(cust)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="avatar-circle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 44, height: 44 }}
                            >
                              {cust.name.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">
                                {cust.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg=""
                            className={`py-2 px-3 rounded-pill fw-bold ${
                              cust.type === "VIP"
                                ? "bg-warning text-dark"
                                : "bg-secondary text-white"
                            }`}
                          >
                            {cust.type === "VIP" && (
                              <Star size={12} className="me-1" />
                            )}
                            {cust.type}
                          </Badge>
                        </td>
                        <td>
                          <div className="fw-bold text-primary">
                            {cust.points.toLocaleString()} pts
                          </div>
                          <div className="x-small text-muted">
                            {cust.type === "NORMAL"
                              ? `${VIP_THRESHOLD - cust.points} pts tới VIP`
                              : "Tối đa"}
                          </div>
                        </td>
                        <td>
                          <Badge
                            bg="success"
                            className="bg-opacity-10 text-success border border-success border-opacity-25 px-2"
                          >
                            {cust.phone}
                          </Badge>
                        </td>
                        <td className="pe-4 text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <OverlayTrigger
                              overlay={<Tooltip>Tích điểm nhanh</Tooltip>}
                            >
                              <Button
                                variant="link"
                                className="text-success p-2 rounded-circle"
                                onClick={() => handleOpenPointModal(cust)}
                              >
                                <PlusCircle size={20} />
                              </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                              overlay={<Tooltip>Hồ sơ & Lịch sử</Tooltip>}
                            >
                              <Button
                                variant="link"
                                className="text-primary p-2 rounded-circle"
                                onClick={() => handleViewDetail(cust)}
                              >
                                <History size={18} />
                              </Button>
                            </OverlayTrigger>
                            <OverlayTrigger overlay={<Tooltip>Sửa</Tooltip>}>
                              <Button
                                variant="link"
                                className="text-dark p-2 rounded-circle"
                                onClick={() => handleOpenModal("edit", cust)}
                              >
                                <Edit3 size={18} />
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        <div className="my-4 opacity-50">
                          <Search size={48} className="mb-3" />
                          <p>
                            {customers.length === 0
                              ? "Chưa có khách hàng"
                              : "Không tìm thấy dữ liệu phù hợp"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>

            <div className="d-flex justify-content-end align-items-center mt-3">
              <Pagination className="mb-0">
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                />
                {Array.from({ length: totalPages }, (_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={currentPage === idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </>
        )
      ) : (
        <CustomerDetailView
          customer={selectedCust}
          onAddPoint={() => handleOpenPointModal(selectedCust)}
        />
      )}

      {/* MODAL: TẠO/SỬA KHÁCH HÀNG */}
      <CustomerFormModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        mode={modalMode}
        customer={selectedCust}
        onSave={handleSaveCustomer}
      />

      {/* MODAL: TÍCH ĐIỂM ĐƠN GIẢN (NEW FUNCTIONALITY) */}
      <PointAccumulationModal
        show={showPointModal}
        handleClose={() => setShowPointModal(false)}
        customer={selectedCust}
        onConfirm={processPoints}
        onDeduct={processDeductPoints}
      />
    </Container>
  );
}

// COMPONENT: MODAL TÍCH ĐIỂM
function PointAccumulationModal({
  show,
  handleClose,
  customer,
  onConfirm,
  onDeduct,
}) {
  const [amount, setAmount] = useState("");
  const pointsToEarn = Math.floor(Number(amount) / POINT_RATE) || 0;

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header closeButton className="border-0 px-4 pt-4">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <Coins size={24} className="text-success" /> Tích điểm hóa đơn
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        <p className="text-muted small mb-4">
          Nhập giá trị đơn hàng để tự động cộng điểm cho{" "}
          <strong>{customer?.name}</strong>.
        </p>
        <Form.Group className="mb-4">
          <Form.Label className="fw-bold small">
            Giá trị hóa đơn (VNĐ)
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              placeholder="Ví dụ: 500000"
              className="py-3 bg-light border-0 fw-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <InputGroup.Text className="bg-light border-0 fw-bold">
              VNĐ
            </InputGroup.Text>
          </InputGroup>
          <div className="mt-3 p-3 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-20 d-flex justify-content-between align-items-center">
            <div>
              <div className="x-small text-success fw-bold text-uppercase">
                Điểm dự kiến nhận
              </div>
              <h4 className="fw-black text-success mb-0">
                +{pointsToEarn.toLocaleString()}{" "}
                <span className="small fw-normal">pts</span>
              </h4>
            </div>
            <Award size={32} className="text-success opacity-50" />
          </div>
          <Form.Text className="text-muted small mt-2 d-block italic text-center">
            Quy tắc: 10,000 VNĐ = 1 điểm thưởng.
          </Form.Text>
        </Form.Group>
        <div className="d-grid gap-2">
          <div className="d-grid gap-2">
            <Button
              variant="success"
              className="btn-success-gradient py-3 fw-bold shadow-sm"
              onClick={() => {
                onConfirm(Number(amount));
                setAmount("");
              }}
              disabled={pointsToEarn <= 0}
            >
              Xác nhận tích điểm
            </Button>

            <Button
              variant="danger"
              className="py-3 fw-bold shadow-sm"
              onClick={() => {
                onDeduct(Number(amount));
                setAmount("");
              }}
              disabled={pointsToEarn <= 0}
            >
              ❌ Trừ điểm
            </Button>

            <Button
              variant="light"
              className="py-2 text-muted fw-bold border-0 bg-transparent"
              onClick={handleClose}
            >
              Hủy bỏ
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

function CustomerFormModal({ show, handleClose, mode, customer, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("NORMAL");
  const [points, setPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  React.useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setType(customer.type || "NORMAL");
      setPoints(customer.points || 0);
    } else {
      setName("");
      setPhone("");
      setType("NORMAL");
      setPoints(0);
    }
    setFormError(null);
  }, [customer, show]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("Vui lòng nhập họ tên");
      return;
    }
    if (!phone.trim()) {
      setFormError("Vui lòng nhập số điện thoại");
      return;
    }

    // Validate số điện thoại: 10 chữ số, bắt đầu bằng 0
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      setFormError("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      type: type === "VIP" ? "VIP" : "NORMAL",
      points: Number(points) || 0,
    };

    try {
      setSubmitting(true);
      await onSave(payload);
      handleClose();
    } catch (error) {
      setFormError(error?.message || "Lưu khách hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      className="border-0"
    >
      <Modal.Header closeButton className="border-0 px-4 pt-4 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <div className="p-2 bg-primary bg-opacity-10 rounded-3 text-primary">
            {mode === "create" ? <UserPlus size={20} /> : <Edit3 size={20} />}
          </div>
          {mode === "create" ? "Đăng ký khách hàng mới" : "Cập nhật thông tin"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form>
          <div className="mb-4">
            <h6 className="fw-bold text-uppercase small text-primary mb-3 border-start border-primary border-4 ps-2">
              Thông tin định danh
            </h6>
            <Row className="g-3">
              <Form.Group as={Col} md={6}>
                <Form.Label className="small fw-bold">
                  Họ và tên <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên đầy đủ"
                  className="bg-light border-0 py-2"
                />
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label className="small fw-bold">
                  Số điện thoại <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={mode === "edit"}
                  placeholder="0901234567"
                  className={`bg-light border-0 py-2 ${mode === "edit" ? "text-muted" : ""}`}
                />
                {mode === "edit" && (
                  <Form.Text className="text-muted x-small italic">
                    Số điện thoại không thể thay đổi.
                  </Form.Text>
                )}
                {mode === "create" && (
                  <Form.Text className="text-muted x-small">
                    Ví dụ: 0901234567 (10 chữ số, bắt đầu bằng 0)
                  </Form.Text>
                )}
              </Form.Group>
            </Row>
          </div>

          <div>
            <h6 className="fw-bold text-uppercase small text-primary mb-3 border-start border-primary border-4 ps-2">
              Điểm và phân loại
            </h6>
            <Row className="g-3">
              <Form.Group as={Col} md={6}>
                <Form.Label className="small fw-bold">Phân loại</Form.Label>
                <Form.Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-light border-0 py-2"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="VIP">VIP</option>
                </Form.Select>
              </Form.Group>
            </Row>
          </div>

          {formError && <div className="mt-3 text-danger">{formError}</div>}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4">
        <Button variant="light" onClick={handleClose} className="px-4 fw-bold">
          Hủy bỏ
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          className="px-5 fw-bold d-flex align-items-center gap-2"
          disabled={submitting}
        >
          <Save size={18} /> {mode === "create" ? "Tạo hồ sơ" : "Lưu thay đổi"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
