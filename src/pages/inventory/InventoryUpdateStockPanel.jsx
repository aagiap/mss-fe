import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const initialAdjustForm = {
  productId: "",
  storeId: "",
  adjustmentType: "INCREASE",
  quantity: "",
  lowStockThreshold: "",
  reason: "MANUAL_UPDATE",
  notes: "",
};

export default function InventoryUpdateStockPanel({ currentUser, stores, isStoreLocked, prefillItem, onBack }) {
  const [adjustForm, setAdjustForm] = useState(initialAdjustForm);
  const [adjusting, setAdjusting] = useState(false);
  const [productSearchKeyword, setProductSearchKeyword] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!prefillItem) {
      setAdjustForm({
        ...initialAdjustForm,
        storeId: currentUser?.storeId ? String(currentUser.storeId) : "",
      });
      setProductSearchKeyword("");
      setProductSearchResults([]);
      return;
    }

    setAdjustForm({
      ...initialAdjustForm,
      productId: String(prefillItem.productId || ""),
      storeId: String(prefillItem.storeId || ""),
      lowStockThreshold: prefillItem.lowStockThreshold != null ? String(prefillItem.lowStockThreshold) : "",
    });
    setProductSearchKeyword(String(prefillItem.productId || ""));
    setProductSearchResults([
      {
        id: prefillItem.productId,
        name: `Product #${prefillItem.productId}`,
        barcode: null,
      },
    ]);
  }, [currentUser?.storeId, prefillItem]);

  const searchProducts = async () => {
    const keyword = productSearchKeyword.trim();
    if (!keyword) {
      setProductSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    setError("");
    try {
      const products = await inventoryApi.searchProductsByKeyword(keyword);
      setProductSearchResults(products || []);
    } catch (e) {
      setProductSearchResults([]);
      setError(e.response?.data?.message || "Cannot search product.");
    } finally {
      setSearchingProducts(false);
    }
  };

  const submitAdjustStock = async () => {
    if (!adjustForm.productId || !adjustForm.storeId || !adjustForm.quantity) {
      setError("Please select product, store and quantity.");
      return;
    }

    setAdjusting(true);
    setError("");
    setSuccessMessage("");

    try {
      await inventoryApi.adjustStock({
        productId: Number(adjustForm.productId),
        storeId: Number(adjustForm.storeId),
        adjustmentType: adjustForm.adjustmentType,
        quantity: Number(adjustForm.quantity),
        lowStockThreshold: adjustForm.lowStockThreshold === "" ? null : Number(adjustForm.lowStockThreshold),
        reason: adjustForm.reason || null,
        notes: adjustForm.notes || null,
      });

      setSuccessMessage("Stock updated successfully.");
      setAdjustForm({
        ...initialAdjustForm,
        storeId: isStoreLocked && currentUser?.storeId ? String(currentUser.storeId) : "",
      });
      setProductSearchKeyword("");
      setProductSearchResults([]);
    } catch (e) {
      setError(e.response?.data?.message || "Update stock failed.");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Update Stock</h4>
        <Button variant="outline-secondary" onClick={onBack} style={{ borderRadius: 6, paddingInline: 16, fontWeight: 600 }}>
          Back to Inventory
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={7}>
              <Form.Label>Search Product (name/barcode)</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  value={productSearchKeyword}
                  placeholder="Type product name or barcode"
                  onChange={(e) => setProductSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                />
                <Button variant="outline-secondary" onClick={searchProducts} disabled={searchingProducts}>
                  {searchingProducts ? (
                    <span className="d-flex align-items-center gap-2">
                      <Spinner size="sm" /> Searching
                    </span>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </Col>

            <Col md={5}>
              <Form.Label>Product</Form.Label>
              <Form.Select value={adjustForm.productId} onChange={(e) => setAdjustForm((prev) => ({ ...prev, productId: e.target.value }))}>
                <option value="">Choose product</option>
                {productSearchResults.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.barcode ? ` - ${p.barcode}` : ""}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Store</Form.Label>
              <Form.Select
                value={adjustForm.storeId}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, storeId: e.target.value }))}
                disabled={isStoreLocked}
              >
                <option value="">Choose store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Adjustment</Form.Label>
              <Form.Select value={adjustForm.adjustmentType} onChange={(e) => setAdjustForm((prev) => ({ ...prev, adjustmentType: e.target.value }))}>
                <option value="INCREASE">INCREASE</option>
                <option value="DECREASE">DECREASE</option>
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Quantity</Form.Label>
              <Form.Control type="number" min={1} value={adjustForm.quantity} onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))} />
            </Col>

            <Col md={6}>
              <Form.Label>Low Stock Threshold</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={adjustForm.lowStockThreshold}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
              />
            </Col>

            <Col md={6}>
              <Form.Label>Reason</Form.Label>
              <Form.Control value={adjustForm.reason} onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))} />
            </Col>

            <Col md={12}>
              <Form.Label>Notes</Form.Label>
              <Form.Control value={adjustForm.notes} onChange={(e) => setAdjustForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-3">
            <Button variant="dark" disabled={adjusting} onClick={submitAdjustStock}>
              {adjusting ? "Saving..." : "Save"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
