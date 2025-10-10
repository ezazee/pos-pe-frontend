import React, { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  QrCode,
  Image as ImageIcon,
  Pencil,
  X,
} from "lucide-react";

function POSPage() {
  const { user, token } = useContext(AuthContext);
  const isAdmin = user && user.role === "admin";

  // products / search
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // cart
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  // payment
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qris"); // 'qris' | 'edc_debit'
  const [qrisAcquirer, setQrisAcquirer] = useState("");
  const [qrisRrn, setQrisRrn] = useState("");
  const [edcIssuer, setEdcIssuer] = useState("");
  const [edcApprovalCode, setEdcApprovalCode] = useState("");
  const [loading, setLoading] = useState(false);

  // sale / invoice
  const [currentSale, setCurrentSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // create product (admin)
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [pSku, setPSku] = useState("");
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pActive, setPActive] = useState(true);
  const [pImage, setPImage] = useState(null);
  const [pImagePreview, setPImagePreview] = useState(null);

  // edit product (admin)
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [eSku, setESku] = useState("");
  const [eName, setEName] = useState("");
  const [eCategory, setECategory] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eStock, setEStock] = useState("");
  const [eActive, setEActive] = useState(true);
  const [eImage, setEImage] = useState(null);
  const [eImagePreview, setEImagePreview] = useState(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  async function fetchProducts() {
    try {
      const res = await axios.get(`${API}/products`, {
        params: { q: searchQuery, limit: 200 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products || []);
    } catch {
      toast.error("Gagal memuat produk");
    }
  }

  // ===== Helpers =====
  const formatCurrency = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;
  const addToCart = (product) => {
    const ex = cart.find((i) => i.product_id === product.id);
    if (ex) updateQuantity(product.id, ex.qty + 1);
    else {
      setCart((prev) => [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          line_discount_amount: 0,
          line_total: product.price,
        },
      ]);
    }
  };
  const updateQuantity = (pid, qty) => {
    if (qty < 1) return removeFromCart(pid);
    setCart(
      cart.map((i) =>
        i.product_id === pid
          ? { ...i, qty, line_total: i.price * qty - i.line_discount_amount }
          : i
      )
    );
  };
  const updateLineDiscount = (pid, discStr) => {
    const d = parseInt(discStr) || 0;
    setCart(
      cart.map((i) => {
        if (i.product_id !== pid) return i;
        const valid = Math.min(d, i.price * i.qty);
        return {
          ...i,
          line_discount_amount: valid,
          line_total: i.price * i.qty - valid,
        };
      })
    );
  };
  const removeFromCart = (pid) =>
    setCart(cart.filter((i) => i.product_id !== pid));
  const subtotal = () => cart.reduce((s, i) => s + i.line_total, 0);
  const grandTotal = () => {
    const sub = subtotal();
    const after = sub - discountAmount;
    const r = after % 100;
    return r >= 50 ? after + (100 - r) : after - r;
  };

  // ===== Create product =====
  const resetCreateForm = () => {
    setPSku("");
    setPName("");
    setPCategory("");
    setPPrice("");
    setPStock("");
    setPActive(true);
    setPImage(null);
    setPImagePreview(null);
  };
  const onFileChangeNew = (file) => {
    setPImage(file || null);
    setPImagePreview(file ? URL.createObjectURL(file) : null);
  };
  async function handleCreateProduct() {
    if (!pSku.trim() || !pName.trim() || !pPrice || !pStock) {
      toast.error("SKU, Nama, Harga, dan Stok wajib diisi");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("sku", pSku.trim());
      fd.append("name", pName.trim());
      fd.append("category", pCategory.trim());
      fd.append("price", String(pPrice));
      fd.append("stock_qty", String(pStock));
      fd.append("is_active", String(pActive));
      if (pImage) fd.append("image", pImage);

      await axios.post(`${API}/products`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Produk ditambahkan");
      setShowCreateProduct(false);
      resetCreateForm();
      fetchProducts();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Gagal menambah produk");
    }
  }

  // ===== Edit / Delete product =====
  const openEdit = (p) => {
    setEditProduct(p);
    setESku(p.sku || "");
    setEName(p.name || "");
    setECategory(p.category || "");
    setEPrice(p.price ?? "");
    setEStock(p.stock_qty ?? "");
    setEActive(p.is_active !== false);
    setEImage(null);
    setEImagePreview(null);
    setShowEditProduct(true);
  };
  const onFileChangeEdit = (file) => {
    setEImage(file || null);
    setEImagePreview(file ? URL.createObjectURL(file) : null);
  };
  async function handleUpdateProduct() {
    if (!editProduct) return;
    try {
      const fd = new FormData();
      if (eSku !== "") fd.append("sku", eSku);
      if (eName !== "") fd.append("name", eName);
      fd.append("category", eCategory);
      fd.append("price", String(ePrice));
      fd.append("stock_qty", String(eStock));
      fd.append("is_active", String(eActive));
      if (eImage) fd.append("image", eImage);

      const res = await axios.patch(`${API}/products/${editProduct.id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Produk diperbarui");
      setShowEditProduct(false);
      setEditProduct(null);
      // refresh local list cepat:
      setProducts((prev) =>
        prev.map((p) => (p.id === res.data.id ? res.data : p))
      );
    } catch (e) {
      toast.error(e?.response?.data?.message || "Gagal memperbarui produk");
    }
  }
  async function handleDeleteProduct(p) {
    if (!window.confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await axios.delete(`${API}/products/${p.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Produk dihapus");
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Gagal menghapus produk");
    }
  }

  // ===== Payment =====
  const handlePayment = () => {
    if (cart.length === 0) return toast.error("Keranjang kosong");
    if (discountAmount > subtotal())
      return toast.error("Diskon tidak boleh melebihi subtotal");
    setShowPaymentDialog(true);
  };
  async function confirmPayment() {
    setLoading(true);
    try {
      const payload = {
        items: cart,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
      };
      if (paymentMethod === "qris") {
        payload.qris_acquirer = qrisAcquirer;
        payload.qris_rrn = qrisRrn;
      } else {
        payload.edc_issuer = edcIssuer;
        payload.edc_approval_code = edcApprovalCode;
      }

      const res = await axios.post(`${API}/sales`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentSale(res.data);
      toast.success("Transaksi berhasil");
      setShowPaymentDialog(false);
      setShowInvoice(true);
      setCart([]);
      setDiscountAmount(0);
      setQrisAcquirer("");
      setQrisRrn("");
      setEdcIssuer("");
      setEdcApprovalCode("");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Transaksi gagal");
    } finally {
      setLoading(false);
    }
  }

  const printInvoice = () => window.print();

  // ======================= UI =======================
  return (
    <div
      className="flex h-full gap-4 flex-col md:flex-row"
      data-testid="pos-page"
    >
      {/* LEFT - Products */}
      <div className="md:w-2/5 w-full flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold text-base text-gray-700">Katalog</div>
          {isAdmin && (
            <Button
              onClick={() => setShowCreateProduct(true)}
              className="gap-2"
              style={{ background: "#009CDE", color: "white" }}
              size="sm"
              data-testid="btn-open-create-product"
            >
              <Plus size={16} />
              Tambah Produk
            </Button>
          )}
        </div>

        <Card className="p-3 md:p-4 mb-3 md:mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Cari produk (nama, SKU, barcode)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Card className="flex-1 overflow-y-auto p-3 md:p-4">
          <h3 className="font-semibold text-lg mb-3 md:mb-4">Produk</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-3 border-2 rounded-lg text-left hover:border-[#009CDE] transition-all"
                style={{ borderColor: "#e5e7eb" }}
              >
                <button
                  onClick={() => addToCart(product)}
                  className="w-full text-left"
                >
                  {/* Gambar produk: rapi & jelas */}
                  <div className="mb-2 overflow-hidden rounded-lg border bg-[#1E9BD5]">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={
                          product.image_url || "/img/placeholder-product.png"
                        }
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-200 hover:scale-[1.01]"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/img/placeholder-product.png";
                        }}
                        srcSet={
                          product.image_url
                            ? `${product.image_url} 1x, ${product.image_url} 2x`
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  <div className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    SKU: {product.sku}
                  </div>
                  <div className="font-bold" style={{ color: "#009CDE" }}>
                    {formatCurrency(product.price)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Stok: {product.stock_qty}
                  </div>
                </button>

                {isAdmin && (
                  <div className="mt-2 flex justify-end">
                    <div className="inline-flex items-center rounded-lg border bg-white/80 px-1 py-1 shadow-sm backdrop-blur">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(product)}
                        className="h-8 px-2 rounded-md border-none hover:bg-gray-100"
                        title="Edit produk"
                      >
                        <Pencil size={14} className="mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>

                      <div className="mx-1 h-5 w-px bg-gray-200" aria-hidden />

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className="h-8 px-2 rounded-md"
                        title="Hapus produk"
                      >
                        <Trash2 size={14} className="mr-1" />
                        <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RIGHT - Cart */}
      <div className="flex-1 w-full flex flex-col">
        <Card className="flex-1 overflow-y-auto p-3 md:p-4 mb-3 md:mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ShoppingCart size={20} />
              Keranjang ({cart.length})
            </h3>
            {cart.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCart([])}>
                Kosongkan
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product_id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(item.product_id, item.qty - 1)
                      }
                    >
                      <Minus size={16} />
                    </Button>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateQuantity(
                          item.product_id,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(item.product_id, item.qty + 1)
                      }
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Diskon (Rp):</Label>
                    <Input
                      type="number"
                      value={item.line_discount_amount}
                      onChange={(e) =>
                        updateLineDiscount(item.product_id, e.target.value)
                      }
                      className="flex-1"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-sm text-gray-600">Total baris:</span>
                    <span className="font-bold" style={{ color: "#009CDE" }}>
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Summary */}
        <Card className="p-3 md:p-4">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">
                {formatCurrency(subtotal())}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label>Diskon Total (Rp):</Label>
              <Input
                type="number"
                value={discountAmount}
                onChange={(e) =>
                  setDiscountAmount(parseInt(e.target.value) || 0)
                }
                className="w-32"
                min="0"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>TOTAL:</span>
              <span style={{ color: "#009CDE" }}>
                {formatCurrency(grandTotal())}
              </span>
            </div>
          </div>

          <Button
            className="w-full text-white font-semibold py-4 md:py-6 text-base md:text-lg"
            style={{ background: "#009CDE" }}
            onClick={handlePayment}
            disabled={cart.length === 0}
          >
            Bayar Sekarang
          </Button>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        {/* -> Lebarkan + padding nyaman */}
        <DialogContent className="w-[92vw] max-w-[560px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Metode Pembayaran</DialogTitle>
          </DialogHeader>

          {/* Segmented tabs: selalu terbaca */}
          <div
            role="tablist"
            aria-label="payment-method"
            className="grid grid-cols-2 gap-2 mb-4"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={paymentMethod === "qris"}
              onClick={() => setPaymentMethod("qris")}
              className={`h-11 w-full rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center
          ${
            paymentMethod === "qris"
              ? "bg-[#009CDE] text-white hover:bg-[#008ac4]"
              : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
          }`}
            >
              <QrCode className="mr-2 h-5 w-5" />
              QRIS
            </Button>

            <Button
              type="button"
              role="tab"
              aria-selected={paymentMethod === "edc_debit"}
              onClick={() => setPaymentMethod("edc_debit")}
              className={`h-11 w-full rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center
          ${
            paymentMethod === "edc_debit"
              ? "bg-[#009CDE] text-white hover:bg-[#008ac4]"
              : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
          }`}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Debit EDC
            </Button>
          </div>

          {paymentMethod === "qris" ? (
            <div className="space-y-3">
              <div>
                <Label>Acquirer (Bank)</Label>
                <Input
                  value={qrisAcquirer}
                  onChange={(e) => setQrisAcquirer(e.target.value)}
                  placeholder="Contoh: GoPay, OVO"
                />
              </div>
              <div>
                <Label>RRN (Reference Number)</Label>
                <Input
                  value={qrisRrn}
                  onChange={(e) => setQrisRrn(e.target.value)}
                  placeholder="123456789012"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Bank Penerbit</Label>
                <Input
                  value={edcIssuer}
                  onChange={(e) => setEdcIssuer(e.target.value)}
                  placeholder="Contoh: BCA, Mandiri"
                />
              </div>
              <div>
                <Label>Approval Code</Label>
                <Input
                  value={edcApprovalCode}
                  onChange={(e) => setEdcApprovalCode(e.target.value)}
                  placeholder="ABC123"
                />
              </div>
            </div>
          )}

          {/* Ringkasan total lebih kontras */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Pembayaran:</span>
              <span className="text-2xl font-bold" style={{ color: "#009CDE" }}>
                {formatCurrency(grandTotal())}
              </span>
            </div>
          </div>

          <Button
            className="mt-4 w-full text-white font-semibold h-11"
            style={{ background: "#009CDE" }}
            onClick={confirmPayment}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-md w-[95vw]">
          {currentSale && (
            <div className="text-[12px] leading-tight">
              {/* Header */}
              <div className="text-center mb-3 pb-3 border-b border-dashed">
                <div
                  className="inline-block px-4 py-1.5 rounded mb-2"
                  style={{ background: "#009CDE" }}
                >
                  <div className="text-white font-bold text-base">
                    PE Skinpro
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Jakarta · Tel: (021) 123-4567
                </div>
              </div>

              <div
                className="text-center font-bold mb-3"
                style={{ color: "#009CDE" }}
              >
                INVOICE
              </div>

              {/* meta */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>No. Invoice</span>
                    <span className="font-semibold">
                      {currentSale.invoice_no}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>
                      {currentSale.date} {currentSale.time}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Kasir</span>
                    <span>{currentSale.cashier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode</span>
                    <Badge
                      style={{ background: "#009CDE" }}
                      className="text-white"
                    >
                      {currentSale.payment_method === "qris"
                        ? "QRIS"
                        : "Debit EDC"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* items */}
              <div className="border-t border-dashed pt-2 mb-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600">
                      <th className="text-left">Item</th>
                      <th className="text-center w-[18%]">Qty</th>
                      <th className="text-right w-[30%]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSale.items.map((it, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1 pr-2">{it.name}</td>
                        <td className="text-center">{it.qty}</td>
                        <td className="text-right">
                          {formatCurrency(it.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* totals */}
              <div className="border-t border-dashed pt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(currentSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span>- {formatCurrency(currentSale.discount_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 mt-1 border-t border-dashed">
                  <span>Grand Total</span>
                  <span style={{ color: "#009CDE" }}>
                    {formatCurrency(currentSale.total)}
                  </span>
                </div>
              </div>

              <div className="text-center text-[11px] text-gray-600 mt-4 pt-3 border-t border-dashed">
                Terima kasih telah berbelanja di <strong>PE Skinpro</strong>
                <br />
                Simpan struk ini sebagai bukti pembayaran.
              </div>

              <div className="mt-3">
                <Button
                  className="w-full text-white font-semibold"
                  style={{ background: "#009CDE" }}
                  onClick={printInvoice}
                >
                  Cetak Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Product (Admin) */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Tambah Produk</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input
                value={pSku}
                onChange={(e) => setPSku(e.target.value)}
                placeholder="SRM-B"
              />
            </div>
            <div>
              <Label>Nama</Label>
              <Input
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="Serum B"
              />
            </div>
            <div>
              <Label>Kategori</Label>
              <Input
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                placeholder="Skincare"
              />
            </div>
            <div>
              <Label>Harga (Rp)</Label>
              <Input
                type="number"
                min="0"
                value={pPrice}
                onChange={(e) => setPPrice(e.target.value)}
                placeholder="175000"
              />
            </div>
            <div>
              <Label>Stok</Label>
              <Input
                type="number"
                min="0"
                value={pStock}
                onChange={(e) => setPStock(e.target.value)}
                placeholder="40"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="active"
                type="checkbox"
                checked={pActive}
                onChange={(e) => setPActive(e.target.checked)}
              />
              <Label htmlFor="active">Aktif</Label>
            </div>
            <div className="md:col-span-2">
              <Label>Gambar (opsional)</Label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <ImageIcon size={16} />
                  <span>Pilih Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      onFileChangeNew(e.target.files && e.target.files[0])
                    }
                  />
                </label>
                {pImage && (
                  <span className="text-sm text-gray-600">{pImage.name}</span>
                )}
              </div>
              {pImagePreview && (
                <img
                  src={pImagePreview}
                  alt="preview"
                  className="mt-3 h-32 rounded object-cover"
                />
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleCreateProduct}
              className="flex-1 text-white"
              style={{ background: "#009CDE" }}
            >
              Simpan
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCreateProduct(false);
              }}
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product (Admin) */}
      <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>SKU</Label>
                  <Input
                    value={eSku}
                    onChange={(e) => setESku(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nama</Label>
                  <Input
                    value={eName}
                    onChange={(e) => setEName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Input
                    value={eCategory}
                    onChange={(e) => setECategory(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Harga (Rp)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={ePrice}
                    onChange={(e) => setEPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input
                    type="number"
                    min="0"
                    value={eStock}
                    onChange={(e) => setEStock(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="eactive"
                    type="checkbox"
                    checked={eActive}
                    onChange={(e) => setEActive(e.target.checked)}
                  />
                  <Label htmlFor="eactive">Aktif</Label>
                </div>
                <div className="md:col-span-2">
                  <Label>Gambar (opsional)</Label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <ImageIcon size={16} />
                      <span>Pilih Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          onFileChangeEdit(e.target.files && e.target.files[0])
                        }
                      />
                    </label>
                    {eImage && (
                      <span className="text-sm text-gray-600">
                        {eImage.name}
                      </span>
                    )}
                  </div>
                  {(eImagePreview || editProduct.image_url) && (
                    <img
                      src={eImagePreview || editProduct.image_url}
                      alt="preview"
                      className="mt-3 h-32 rounded object-cover"
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={handleUpdateProduct}
                  className="flex-1 text-white"
                  style={{ background: "#009CDE" }}
                >
                  Simpan Perubahan
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditProduct(false)}
                >
                  Batal
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default POSPage;
