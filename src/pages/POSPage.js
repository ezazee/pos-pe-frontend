import React, { useState, useEffect, useContext, useMemo } from "react";
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
  User,
  List,
  Globe,
} from "lucide-react";

/* Ikon kecil */
const InstagramIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" />
  </svg>
);
const TikTokIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z" />
  </svg>
);

/* ===== kalkulasi paket (client-side, untuk tampilan realtime) ===== */
const calcBulkTotal = (qty, tiers, singlePrice) => {
  if (!qty) return 0;
  const list = (tiers?.length ? tiers : [{ qty: 1, total: singlePrice }]).slice().sort((a,b)=>b.qty-a.qty);
  const dp = Array(qty + 1).fill(Infinity); dp[0]=0;
  for (let i=1;i<=qty;i++){
    for (const t of list) if (t.qty<=i) dp[i]=Math.min(dp[i],dp[i-t.qty]+t.total);
    dp[i]=Math.min(dp[i],dp[i-1]+singlePrice);
  }
  return dp[qty];
};
const allocateGroupTotals = (items, groupTotal) => {
  const totalQty = items.reduce((a,x)=>a+x.qty,0)||1;
  const eff = groupTotal/totalQty;
  const res = items.map(x=>Math.round(eff*x.qty));
  let diff = groupTotal - res.reduce((a,b)=>a+b,0);
  for (let i=res.length-1; diff!==0 && i>=0; i--){ const adj=diff>0?1:-1; res[i]+=adj; diff-=adj; }
  return res;
};
const computeCartWithMixMatch = (cartItems) => {
  const groups = {};
  cartItems.forEach((it, idx) => {
    const code = it.bundle_code || `__single_${it.product_id}`;
    (groups[code] ||= []).push({ idx, item: it });
  });
  const lineTotals = Array(cartItems.length).fill(0);
  Object.values(groups).forEach((list) => {
    const any = list[0].item;
    const hasBulk = any.bundle_code && any.bulk_pricing?.length;
    if (!hasBulk) {
      list.forEach(({ idx, item }) => lineTotals[idx] = item.price * item.qty);
      return;
    }
    const unitPrice = list[0].item.price;
    const same = list.every(x => x.item.price === unitPrice);
    if (!same) {
      list.forEach(({ idx, item }) => lineTotals[idx] = item.price * item.qty);
      return;
    }
    const totalQty = list.reduce((a,x)=>a + x.item.qty, 0);
    const groupTotal = calcBulkTotal(totalQty, any.bulk_pricing, unitPrice);
    const alloc = allocateGroupTotals(list.map(x => ({ qty: x.item.qty })), groupTotal);
    list.forEach(({ idx }, i) => lineTotals[idx] = alloc[i]);
  });
  return lineTotals;
};

function POSPage() {
  const { user, token } = useContext(AuthContext);
  const isAdmin = user && user.role === "admin";

  // products / search
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");

  // cart
  const [cart, setCart] = useState([]);
  const [discountInput, setDiscountInput] = useState("0");

  // payment
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [qrisAcquirer, setQrisAcquirer] = useState("");
  const [qrisRrn, setQrisRrn] = useState("");
  const [edcIssuer, setEdcIssuer] = useState("");
  const [edcApprovalCode, setEdcApprovalCode] = useState("");
  const [loading, setLoading] = useState(false);

  // sale / invoice
  const [currentSale, setCurrentSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // create/edit product (ringkas – sama seperti punyamu)
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [pSku, setPSku] = useState("");
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pActive, setPActive] = useState(true);
  const [pImage, setPImage] = useState(null);
  const [pImagePreview, setPImagePreview] = useState(null);

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

  const [mobileView, setMobileView] = useState("products");

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
      setProducts(res.data.products || res.data || []);
    } catch {
      toast.error("Gagal memuat produk");
    }
  }

  // ===== Helpers =====
  const formatCurrency = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

  const addToCart = (product) => {
    const ex = cart.find((i) => i.product_id === product.id);
    if (ex) return updateQuantity(product.id, ex.qty + 1);
    setCart(prev => [...prev, {
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      original_price: product.original_price, // untuk tampilan coret
      qty: 1,
      bulk_pricing: product.bulk_pricing || [],
      bundle_code: product.bundle_code || null,
    }]);
  };

  const updateQuantity = (pid, qty) => {
    if (qty < 1) return removeFromCart(pid);
    setCart(
      cart.map((i) =>
        i.product_id === pid
          ? { ...i, qty }
          : i
      )
    );
  };

  const removeFromCart = (pid) =>
    setCart(cart.filter((i) => i.product_id !== pid));

  // ===== Derived totals (mix & match aware) =====
  const lineTotals = useMemo(() => computeCartWithMixMatch(cart), [cart]);
  const subtotalValue = useMemo(() => lineTotals.reduce((a,b)=>a+b,0), [lineTotals]);
  const discountAmount = parseInt(discountInput) || 0;
  const grandTotalValue = Math.max(0, subtotalValue - discountAmount);

  const applyDiscountPercentage = (p) => {
    const discountValue = Math.round((subtotalValue * p) / 100);
    setDiscountInput(String(discountValue));
  };

  // ===== Create product (ringkas) =====
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
    if (discountAmount > subtotalValue)
      return toast.error("Diskon tidak boleh melebihi subtotal");
    setShowPaymentDialog(true);
  };

  async function confirmPayment() {
    setLoading(true);
    try {
      const payload = {
        items: cart.map(i => ({ product_id: i.product_id, qty: i.qty })),
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        customer_name: customerName || "-",
        ...(paymentMethod === "qris"
          ? { qris_acquirer: qrisAcquirer, qris_rrn: qrisRrn }
          : { edc_issuer: edcIssuer, edc_approval_code: edcApprovalCode }),
      };
      const res = await axios.post(`${API}/sales`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentSale(res.data);
      toast.success("Transaksi berhasil");
      setShowPaymentDialog(false);
      setShowInvoice(true);
      setCart([]);
      setDiscountInput("0");
      setCustomerName("");
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

  /* ======================= UI ======================= */
  return (
    <div className="relative h-full w-full" data-testid="pos-page">
      <div className="flex h-full flex-col gap-4 p-4 pb-28 lg:flex-row lg:pb-4">
        {/* LEFT - Products */}
        <div className={`w-full flex-col lg:flex lg:w-3/5 xl:w-2/3 ${mobileView === "products" ? "flex" : "hidden"}`}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold text-gray-700">Katalog</div>
            {isAdmin && (
              <Button
                onClick={() => setShowCreateProduct(true)}
                className="gap-2"
                style={{ background: "#009CDE", color: "white" }}
                size="sm"
              >
                <Plus size={16} /> Tambah Produk
              </Button>
            )}
          </div>

          <Card className="p-3 md:p-4 mb-3 md:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Cari produk (nama, SKU, barcode)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          <Card className="flex-1 overflow-y-auto p-3 md:p-4">
            <h3 className="mb-3 font-semibold text-lg md:mb-4">Produk</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-3 border-2 rounded-lg text-left hover:border-[#009CDE] transition-all"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <button onClick={() => addToCart(product)} className="w-full text-left">
                    <div className="mb-2 overflow-hidden rounded-lg border bg-[#1E9BD5]">
                      <div className="relative aspect-[4/3]">
                        <img
                          src={product.image_url || "/img/placeholder-product.png"}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/img/placeholder-product.png";
                          }}
                        />
                      </div>
                    </div>
                    <div className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</div>
                    <div className="text-xs text-gray-500 mb-1">SKU: {product.sku}</div>
                    {/* Harga di kartu produk */}
                    <div className="font-bold items-baseline" style={{ color: "#009CDE" }}>
                      {product.original_price && product.original_price > product.price ? (
                        <>
                          <span>{formatCurrency(product.price)}</span>
                          <br />
                          <span className="text-sm font-normal text-gray-500 line-through mr-2">
                            {formatCurrency(product.original_price)}
                          </span>
                        </>
                      ) : (
                        <span>{formatCurrency(product.price)}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Stok: {product.stock_qty}</div>
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
        <div className={`w-full flex-1 flex-col lg:flex overflow-y-auto ${mobileView === "cart" ? "flex" : "hidden"}`}>
          <Card className="p-3 md:p-4 mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart size={20} /> Keranjang ({cart.length})
              </h3>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCart([])}>
                  Kosongkan
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={item.product_id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="pr-2">
                        <div className="font-semibold leading-tight">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.price)}
                          {item.original_price && item.original_price > item.price && (
                            <> • <span className="line-through text-gray-400">
                              {formatCurrency(item.original_price)}
                            </span></>
                          )}
                          {item.bundle_code && item.qty > 0 && (
                            <> • efektif {formatCurrency(Math.round(lineTotals[idx] / item.qty))}/pcs</>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9"
                          onClick={() => updateQuantity(item.product_id, item.qty - 1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-16 h-9 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9"
                          onClick={() => updateQuantity(item.product_id, item.qty + 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="font-bold text-right" style={{ color: "#009CDE" }}>
                        {formatCurrency(lineTotals[idx])}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Ringkasan Pembayaran */}
          <Card className="p-3 md:p-4">
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotalValue)}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-2">
                <Label>Diskon Total (Rp):</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={discountInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) setDiscountInput(v);
                  }}
                  className="w-32 text-right"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => applyDiscountPercentage(5)}>5%</Button>
                <Button size="sm" variant="outline" onClick={() => applyDiscountPercentage(10)}>10%</Button>
                <Button size="sm" variant="outline" onClick={() => applyDiscountPercentage(15)}>15%</Button>
                <Button size="sm" variant="outline" onClick={() => applyDiscountPercentage(20)}>20%</Button>
                <Button size="sm" variant="destructive" onClick={() => setDiscountInput("0")}>Reset</Button>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xl font-bold pt-2 border-t">
                <span>TOTAL:</span>
                <span style={{ color: "#009CDE" }}>{formatCurrency(grandTotalValue)}</span>
              </div>
            </div>

            <Button
              className="w-full text-white font-semibold py-6 text-lg"
              style={{ background: "#009CDE" }}
              onClick={handlePayment}
              disabled={cart.length === 0}
            >
              Bayar Sekarang
            </Button>
          </Card>
        </div>
      </div>

      {/* Navigasi bawah (mobile) */}
      <div className="fixed bottom-0 left-0 z-10 grid w-full grid-cols-2 gap-2 border-t bg-white/80 p-2 backdrop-blur-sm lg:hidden">
        <Button
          onClick={() => setMobileView("products")}
          variant={mobileView === "products" ? "default" : "outline"}
          className="flex h-12 items-center justify-center gap-2 text-base"
          style={mobileView === "products" ? { background: "#009CDE", color: "white" } : {}}
        >
          <List size={20} /> Katalog
        </Button>
        <Button
          onClick={() => setMobileView("cart")}
          variant={mobileView === "cart" ? "default" : "outline"}
          className="relative flex h-12 items-center justify-center gap-2 text-base"
          style={mobileView === "cart" ? { background: "#009CDE", color: "white" } : {}}
        >
          <ShoppingCart size={20} /> Keranjang
          {cart.length > 0 && (
            <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-1 text-xs text-white">
              {cart.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Dialog Pembayaran */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="w-[92vw] max-w-[560px] p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg">Metode Pembayaran</DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto flex-1">
            <div role="tablist" aria-label="payment-method" className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                role="tab"
                aria-selected={paymentMethod === "qris"}
                onClick={() => setPaymentMethod("qris")}
                className={`h-11 w-full rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center ${
                  paymentMethod === "qris"
                    ? "bg-[#009CDE] text-white hover:bg-[#008ac4]"
                    : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <QrCode className="mr-2 h-5 w-5" /> QRIS
              </Button>
              <Button
                type="button"
                role="tab"
                aria-selected={paymentMethod === "edc_debit"}
                onClick={() => setPaymentMethod("edc_debit")}
                className={`h-11 w-full rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center ${
                  paymentMethod === "edc_debit"
                    ? "bg-[#009CDE] text-white hover:bg-[#008ac4]"
                    : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <CreditCard className="mr-2 h-5 w-5" /> Debit EDC
              </Button>
            </div>

            {paymentMethod === "qris" ? (
              <div className="space-y-3">
                <div className="relative mb-4">
                  <Label className="text-sm font-medium mb-1 block">Nama Pelanggan</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Masukkan Nama Pelanggan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label>Nama Bank</Label>
                  <Input
                    value={qrisAcquirer}
                    onChange={(e) => setQrisAcquirer(e.target.value)}
                    placeholder="Contoh: GoPay, OVO"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-medium mb-1 block">Nama Pelanggan</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Masukkan Nama Pelanggan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Pembayaran:</span>
                <span className="text-2xl font-bold" style={{ color: "#009CDE" }}>
                  {formatCurrency(grandTotalValue)}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Invoice */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-sm w-[95vw] p-0 flex flex-col max-h-[90vh]">
          {currentSale && (
            <>
              <div className="overflow-y-auto flex-1">
                <div id="invoice-to-print" className="p-6 text-[11px] leading-normal">
                  <div className="text-center mb-4">
                    <img src="/img/logo.png" alt="PE SKINPRO" className="h-14 mx-auto mb-2" />
                    <p className="font-bold text-base">PE SKINPRO ID</p>
                    <p>PT Kilau Berlian Nusantara</p>
                    <p>{currentSale.invoice_no}</p>
                    <p className="mt-2">
                      Royal Spring Residence. Block Titanium No. 05, 006/008, Jati Padang, Ps. Minggu, Jakarta Selatan
                    </p>
                    <p>Jl. Dukuh Patra No.75 001/013, Menteng Dalam, Tebet, Jakarta Selatan</p>
                    <p className="mt-2">0812-1234-5678</p>
                    <p>adm.peskinproid@gmail.com</p>
                    <p className="mt-2 text-gray-700">
                      {new Date(currentSale.created_at)
                        .toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                        .replace(",", " •")}
                    </p>
                  </div>

                  <div className="grid grid-cols-[max-content,1fr] gap-x-2 text-xs">
                    <div>Invoice Number:</div>
                    <div className="text-right font-semibold">{currentSale.invoice_no}</div>
                    <div>Customer Name:</div>
                    <div className="text-right">{currentSale.customer_name}</div>
                    <div>Payment Method:</div>
                    <div className="text-right">
                      {currentSale.payment_method.toLowerCase() === "qris" ? "QRIS" : "Debit EDC"}
                    </div>
                    {currentSale.payment_method === "qris" && currentSale.qris_acquirer && (
                      <>
                        <div>Nama Bank:</div>
                        <div className="text-right">{currentSale.qris_acquirer}</div>
                      </>
                    )}
                  </div>

                  <div className="border-b border-black border-dashed my-2"></div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="font-semibold w-[15%]">SKU</th>
                        <th className="font-semibold w-[45%]">Product</th>
                        <th className="font-semibold text-center w-[15%]">Qty</th>
                        <th className="font-semibold text-right w-[25%]">Price</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="border-b border-black border-dashed my-1"></div>
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {currentSale.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="w-[15%]">{item.sku}</td>
                          <td className="w-[45%]">
                            {item.name}
                            {item.original_price && item.price && item.original_price > item.price && (
                              <div className="text-gray-500 line-through">
                                {formatCurrency(item.original_price)}
                              </div>
                            )}
                          </td>
                          <td className="text-center w-[15%]">{item.qty} pcs</td>
                          <td className="text-right w-[25%]">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-black border-dashed pt-2 mt-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(currentSale.subtotal)}</span>
                    </div>
                    {currentSale.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{formatCurrency(currentSale.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span>Amount Due:</span>
                      <span>{formatCurrency(currentSale.total)}</span>
                    </div>
                  </div>

                  <div className="border-b border-black border-dashed my-2"></div>

                  <div className="text-center mt-4">
                    <p>Thank You For Your Purchase!</p>
                    <p className="mt-2">Follow Us To See More Update</p>
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <div className="flex items-center gap-2">
                        <InstagramIcon className="h-4 w-4" />
                        <span>peskinpro.id</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TikTokIcon className="h-4 w-4" />
                        <span>@peskinproid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>www.peskinpro.id</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t flex-shrink-0">
                <Button className="w-full text-white font-semibold" style={{ background: "#009CDE" }} onClick={printInvoice}>
                  Cetak Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Tambah Produk</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input value={pSku} onChange={(e) => setPSku(e.target.value)} placeholder="SRM-B" />
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Serum B" />
            </div>
            <div>
              <Label>Kategori</Label>
              <Input value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="Skincare" />
            </div>
            <div>
              <Label>Harga (Rp)</Label>
              <Input type="number" min="0" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="175000" />
            </div>
            <div>
              <Label>Stok</Label>
              <Input type="number" min="0" value={pStock} onChange={(e) => setPStock(e.target.value)} placeholder="40" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input id="active" type="checkbox" checked={pActive} onChange={(e) => setPActive(e.target.checked)} />
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
                    onChange={(e) => onFileChangeNew(e.target.files && e.target.files[0])}
                  />
                </label>
                {pImage && <span className="text-sm text-gray-600">{pImage.name}</span>}
              </div>
              {pImagePreview && <img src={pImagePreview} alt="preview" className="mt-3 h-32 rounded object-cover" />}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleCreateProduct} className="flex-1 text-white" style={{ background: "#009CDE" }}>
              Simpan
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { setShowCreateProduct(false); }}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <Input value={eSku} onChange={(e) => setESku(e.target.value)} />
                </div>
                <div>
                  <Label>Nama</Label>
                  <Input value={eName} onChange={(e) => setEName(e.target.value)} />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Input value={eCategory} onChange={(e) => setECategory(e.target.value)} />
                </div>
                <div>
                  <Label>Harga (Rp)</Label>
                  <Input type="number" min="0" value={ePrice} onChange={(e) => setEPrice(e.target.value)} />
                </div>
                <div>
                  <Label>Stok</Label>
                  <Input type="number" min="0" value={eStock} onChange={(e) => setEStock(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input id="eactive" type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
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
                        onChange={(e) => onFileChangeEdit(e.target.files && e.target.files[0])}
                      />
                    </label>
                    {eImage && <span className="text-sm text-gray-600">{eImage.name}</span>}
                  </div>
                  {(eImagePreview || editProduct.image_url) && (
                    <img src={eImagePreview || editProduct.image_url} alt="preview" className="mt-3 h-32 rounded object-cover" />
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={handleUpdateProduct} className="flex-1 text-white" style={{ background: "#009CDE" }}>
                  Simpan Perubahan
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowEditProduct(false)}>
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
