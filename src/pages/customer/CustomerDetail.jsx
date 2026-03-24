import React, { useState, useMemo } from "react";
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
  OverlayTrigger,
  Tooltip,
  ProgressBar,
  Toast,
  ToastContainer,
} from "react-bootstrap";
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
export default function CustomerDetailView({ customer, onAddPoint }) {
  const VIP_THRESHOLD = 1000;
  const POINT_RATE = 10000;
  const pointsProgress = Math.min(
    (customer?.points / VIP_THRESHOLD) * 100,
    100,
  );

  return (
    <Row className="g-4 animate-in fade-in">
      {/* LEFT: PROFILE INFO */}
      <Col lg={4}>
        <Card className="custom-card border-0 h-100 overflow-hidden">
          <div className="bg-primary p-4 text-center text-white position-relative overflow-hidden">
            <div
              className="position-absolute opacity-10"
              style={{ right: -20, bottom: -20 }}
            >
              <UserCircle size={150} />
            </div>
            <div
              className="bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center shadow mb-3 shadow-lg"
              style={{
                width: 90,
                height: 90,
                fontSize: "2.5rem",
                fontWeight: 800,
              }}
            >
              {customer?.name.charAt(0)}
            </div>
            <h4 className="fw-bold mb-1">{customer?.name}</h4>
            <Badge
              bg="white"
              text="primary"
              className="mb-3 px-3 py-1 rounded-pill"
            >
              {customer?.id}
            </Badge>
            <div className="d-grid mt-2">
              <Button
                variant="light"
                size="sm"
                className="fw-bold text-primary rounded-pill border-0 shadow-sm py-2"
                onClick={onAddPoint}
              >
                <PlusCircle size={16} className="me-2" /> Tích điểm hóa đơn
              </Button>
            </div>
          </div>
          <Card.Body className="p-4">
            <div className="bg-light p-3 rounded-4 mb-4 border shadow-inner">
              <div className="d-flex justify-content-between align-items-end mb-2">
                <div>
                  <small className="text-muted d-block small fw-bold uppercase x-small">
                    Hạng hiện tại
                  </small>
                  <h5
                    className={`fw-bold mb-0 ${customer?.type === "VIP" ? "text-warning" : "text-primary"}`}
                  >
                    {customer?.type === "VIP" && (
                      <Star size={16} fill="currentColor" />
                    )}{" "}
                    {customer?.type}
                  </h5>
                </div>
                <div className="text-end">
                  <h5 className="fw-bold mb-0 text-dark">
                    {customer?.points.toLocaleString()}
                  </h5>
                  <small className="text-muted x-small font-bold">
                    PTS TÍCH LŨY
                  </small>
                </div>
              </div>
              <ProgressBar
                now={pointsProgress}
                variant={customer?.type === "VIP" ? "warning" : "primary"}
                className="rounded-pill mb-2 shadow-sm"
                style={{ height: 10 }}
              />
              {customer?.type === "NORMAL" ? (
                <div className="text-center x-small text-muted font-bold uppercase">
                  Cần <strong>{VIP_THRESHOLD - customer?.points} pts</strong>{" "}
                  nữa để lên VIP
                </div>
              ) : (
                <div className="text-center x-small text-warning fw-bold uppercase">
                  Bạn đang ở hạng cao nhất{" "}
                  <Star size={10} fill="currentColor" />
                </div>
              )}
            </div>

            {/* <div className="space-y-4">
              <DetailRow icon={<Phone size={16} />} label="Điện thoại" value={customer?.phone} />
              <DetailRow icon={<Mail size={16} />} label="Email" value={customer?.email} />
              <DetailRow icon={<Calendar size={16} />} label="Ngày sinh" value={customer?.dob} />
              value={`${customer?.address?.street || ""}, ${customer?.address?.ward || ""}, ${customer?.address?.city || ""}`}
            </div> */}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={8}>
        <Card className="custom-card border-0 h-100 shadow-sm">
          <Card.Body className="p-0">
            <Tabs
              defaultActiveKey="history"
              className="px-4 pt-3 border-0 custom-tabs"
            >
              <Tab
                eventKey="history"
                title={
                  <div className="d-flex align-items-center gap-2 py-2">
                    <History size={18} /> Lịch sử mua hàng
                  </div>
                }
              >
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <div className="bg-primary rounded-circle w-2 h-2"></div>{" "}
                      Giao dịch gần nhất
                    </h6>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-decoration-none text-muted small fw-bold"
                    >
                      Xem tất cả
                    </Button>
                  </div>
                  <Table responsive hover className="align-middle border-0">
                    <thead className="bg-light border-0">
                      <tr className="text-muted small uppercase fw-bold border-0">
                        <th className="py-3 border-0 ps-3">Mã đơn</th>
                        <th className="py-3 border-0">Ngày tạo</th>
                        <th className="py-3 border-0 text-end">Giá trị</th>
                        <th className="py-3 border-0 text-center">Tích lũy</th>
                        <th className="py-3 border-0 text-end pe-3">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer?.history?.map((order) => (
                        <tr
                          key={order.id}
                          className="border-bottom border-light"
                        >
                          <td className="py-3 fw-bold text-dark ps-3">
                            {order.id}
                          </td>
                          <td className="py-3 text-muted small">
                            {order.date}
                          </td>
                          <td className="py-3 text-end fw-bold">
                            {(order.total / 1000).toLocaleString()}.000 đ
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              bg="primary"
                              className="bg-opacity-10 text-primary border border-primary border-opacity-10 px-2 py-1 fw-bold"
                            >
                              +{order.points} pts
                            </Badge>
                          </td>
                          <td className="py-3 text-end pe-3">
                            <Badge
                              bg="success"
                              className="bg-opacity-10 text-success rounded-pill px-3 py-1 fw-bold x-small uppercase"
                            >
                              Hoàn tất
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {(customer?.history?.length || 0) === 0 && (
                    <div className="text-center py-5 text-muted italic">
                      Chưa có dữ liệu giao dịch.
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
function DetailRow({ icon, label, value }) {
  return (
    <div className="d-flex gap-3 mb-4">
      <div className="text-primary mt-1 opacity-75">{icon}</div>
      <div>
        <div className="text-muted small fw-bold text-uppercase x-small tracking-wider mb-1">
          {label}
        </div>
        <div className="text-dark fw-bold">{value || "N/A"}</div>
      </div>
    </div>
  );
}
