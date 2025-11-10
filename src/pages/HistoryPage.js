import React, { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Download, Filter, Eye, Globe } from "lucide-react";
import { Dialog, DialogContent } from "../components/ui/dialog";

/* ===== Ikon sama dengan POSPage ===== */
const InstagramIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM18.406 6.48c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44zM12 7.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162z" />
  </svg>
);
const TikTokIcon = ({ className }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z" />
  </svg>
);

/* ====== util cache free item (disimpan oleh POS) ====== */
const getFreebieFromCache = (invoiceNo) => {
  try {
    const raw = localStorage.getItem("pe_freebies");
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map?.[invoiceNo] || null;
  } catch {
    return null;
  }
};

function HistoryPage() {
  const { token, user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    fetchSales(); /* eslint-disable-next-line */
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (invoiceNo?.trim()) params.invoice = invoiceNo.trim();
      const res = await axios.get(`${API}/sales`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data || []);
    } catch {
      toast.error("Gagal memuat riwayat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const canExport = user && (user.role === "admin" || user.role === "finance");

  const exportToExcel = async () => {
    if (!canExport || !sales?.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const data = sales.map((s) => ({
        "No. Invoice": s.invoice_no,
        Tanggal: s.date,
        Waktu: s.time,
        Kasir: s.cashier_name,
        "Nama Pelanggan": s.customer_name || "-",
        "Jumlah Item": Array.isArray(s.items) ? s.items.length : 0,
        Subtotal: s.subtotal,
        Diskon: s.discount_amount,
        Total: s.total,
        "Metode Pembayaran": s.payment_method === "qris" ? "QRIS" : "Debit EDC",
        "Bank (QRIS)":
          s.payment_method === "qris" ? s.qris_acquirer || "-" : "",
        Status: s.status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
      const now = new Date();
      const filename = `PE-Skinpro_Transactions_${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("File Excel berhasil diunduh");
    } catch {
      toast.error("Gagal mengekspor ke Excel");
    }
  };

  const formatCurrency = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

  // ==== Saat klik Lihat: pastikan free item terisi sama seperti POS ====
  const handleShowInvoice = (sale) => {
    const merged = { ...sale };

    // 1) sudah dari backend?
    const hasBackendFree =
      !!merged.free_item_name ||
      (merged.items || []).some(
        (it) =>
          it?.is_free === true ||
          Number(it?.price) === 0 ||
          Number(it?.line_total) === 0
      );

    // 2) jika tidak, ambil dari cache POS (localStorage)
    if (!hasBackendFree) {
      const cached = getFreebieFromCache(merged.invoice_no);
      if (cached) {
        merged.free_item_name = cached.name;
        merged.free_item_sku = cached.sku || "-";
      }
    }

    setSelectedSale(merged);
    setShowInvoice(true);
  };

  const printInvoice = () => window.print();

  // helper final free item
  const getFreeItem = (sale) => {
    if (!sale) return null;
    if (sale.free_item_name) {
      const already = (sale.items || []).some(
        (it) =>
          (sale.free_item_sku && it.sku === sale.free_item_sku) ||
          (!sale.free_item_sku && it.name === sale.free_item_name)
      );
      return {
        name: sale.free_item_name,
        sku: sale.free_item_sku || "-",
        alreadyInItems: already,
      };
    }
    const found = (sale.items || []).find(
      (it) =>
        it?.is_free === true ||
        Number(it?.price) === 0 ||
        Number(it?.line_total) === 0
    );
    return found
      ? { name: found.name, sku: found.sku || "-", alreadyInItems: true }
      : null;
  };

  return (
    <div className="p-4 space-y-4" data-testid="history-page">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#009CDE" }}>
          Riwayat Transaksi
        </h2>
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1 block">
              Dari Tanggal
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1 block">
              Sampai Tanggal
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">
              No. Invoice
            </label>
            <Input
              placeholder="Cari no. invoice..."
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSales()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSales} disabled={loading}>
              <Filter className="mr-2" size={16} /> Filter
            </Button>
            {canExport && (
              <Button
                onClick={exportToExcel}
                style={{ background: "#009CDE", color: "white" }}
                disabled={!sales?.length}
              >
                <Download className="mr-2" size={16} /> Ekspor
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-12">Memuat data...</div>
        ) : !sales.length ? (
          <div className="text-center py-12 text-gray-500">
            Tidak ada transaksi yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold">
                    No. Invoice
                  </th>
                  <th className="text-left py-3 px-2 font-semibold">Tanggal</th>
                  <th className="text-left py-3 px-2 font-semibold">Kasir</th>
                  <th className="text-left py-3 px-2 font-semibold">
                    Pelanggan
                  </th>
                  <th className="text-center py-3 px-2 font-semibold">Item</th>
                  <th className="text-right py-3 px-2 font-semibold">
                    Subtotal
                  </th>
                  <th className="text-right py-3 px-2 font-semibold">Diskon</th>
                  <th className="text-right py-3 px-2 font-semibold">Total</th>
                  <th className="text-center py-3 px-2 font-semibold">
                    Metode
                  </th>
                  <th className="text-left py-3 px-2 font-semibold">
                    Bank (QRIS)
                  </th>
                  <th className="text-center py-3 px-2 font-semibold">
                    Status
                  </th>
                  <th className="text-center py-3 px-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono">{sale.invoice_no}</td>
                    <td className="py-3 px-2">
                      {sale.date} {sale.time}
                    </td>
                    <td className="py-3 px-2">{sale.cashier_name}</td>
                    <td className="py-3 px-2">{sale.customer_name || "-"}</td>
                    <td className="py-3 px-2 text-center">
                      {Array.isArray(sale.items) ? sale.items.length : 0}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatCurrency(sale.subtotal)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {formatCurrency(sale.discount_amount)}
                    </td>
                    <td
                      className="py-3 px-2 text-right font-semibold"
                      style={{ color: "#009CDE" }}
                    >
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="outline">
                        {sale.payment_method === "qris" ? "QRIS" : "Debit EDC"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {sale.payment_method === "qris"
                        ? sale.qris_acquirer || "-"
                        : ""}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        style={{
                          background:
                            sale.status === "PAID" ? "#10b981" : "#ef4444",
                          color: "white",
                        }}
                      >
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowInvoice(sale)}
                      >
                        <Eye size={14} className="mr-1" /> Lihat
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ====== DIALOG INVOICE ====== */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-sm w-[95vw] p-0 flex flex-col max-h-[90vh]">
          {selectedSale &&
            (() => {
              const freeItem = getFreeItem(selectedSale);
              return (
                <>
                  <div className="overflow-y-auto flex-1">
                    <div
                      id="invoice-to-print"
                      className="p-6 text-[11px] leading-normal"
                    >
                      {/* Header */}
                      <div className="text-center mb-4">
                        <img
                          src="/img/logo.png"
                          alt="PE SKINPRO"
                          className="h-14 mx-auto mb-2"
                        />
                        <p className="font-bold text-base">PE SKINPRO ID</p>
                        <p>PT Kilau Berlian Nusantara</p>
                        <p>{selectedSale.invoice_no}</p>
                        <p className="mt-2">
                          Royal Spring Residence. Block Titanium No. 05,
                          006/008, Jati Padang, Ps. Minggu, Jakarta Selatan
                        </p>
                        <p>
                          Jl. Dukuh Patra No.75 001/013, Menteng Dalam, Tebet,
                          Jakarta Selatan
                        </p>
                        <p className="mt-2">0812-1234-5678</p>
                        <p>adm.peskinproid@gmail.com</p>
                        <p className="mt-2 text-gray-700">
                          {new Date(selectedSale.created_at)
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

                      {/* Detail */}
                      <div className="grid grid-cols-[max-content,1fr] gap-x-2 text-xs">
                        <div>Invoice Number:</div>
                        <div className="text-right font-semibold">
                          {selectedSale.invoice_no}
                        </div>
                        <div>Customer Name:</div>
                        <div className="text-right">
                          {selectedSale.customer_name}
                        </div>
                        <div>Payment Method:</div>
                        <div className="text-right">
                          {selectedSale.payment_method?.toLowerCase() === "qris"
                            ? "QRIS"
                            : "Bank Transfer"}
                        </div>
                        {selectedSale.payment_method === "qris" &&
                          selectedSale.qris_acquirer && (
                            <>
                              <div>Nama Bank:</div>
                              <div className="text-right">
                                {selectedSale.qris_acquirer}
                              </div>
                            </>
                          )}
                        {/* Info Free Item */}
                        {freeItem && (
                          <>
                            <div>Free Item:</div>
                            <div className="text-right">
                              {freeItem.name} (SKU: {freeItem.sku})
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-b border-black border-dashed my-2"></div>

                      {/* Tabel Items */}
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr>
                            <th className="font-semibold w-[15%]">SKU</th>
                            <th className="font-semibold w-[45%]">Product</th>
                            <th className="font-semibold text-center w-[15%]">
                              Qty
                            </th>
                            <th className="font-semibold text-right w-[25%]">
                              Price
                            </th>
                          </tr>
                        </thead>
                      </table>
                      <div className="border-b border-black border-dashed my-1"></div>
                      <table className="w-full text-left text-xs">
                        <tbody>
                          {(selectedSale.items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td className="w-[15%]">{item.sku}</td>
                              <td className="w-[45%]">
                                {item.name}
                                {item.original_price &&
                                  item.original_price > item.price && (
                                    <div className="text-gray-500 line-through">
                                      {formatCurrency(item.original_price)}
                                    </div>
                                  )}
                              </td>
                              <td className="text-center w-[15%]">
                                {item.qty} pcs
                              </td>
                              <td className="text-right w-[25%]">
                                {formatCurrency(item.line_total)}
                              </td>
                            </tr>
                          ))}

                          {/* Tambahkan baris Rp 0 hanya jika belum ada di items */}
                          {freeItem && !freeItem.alreadyInItems && (
                            <tr>
                              <td className="w-[15%]">{freeItem.sku}</td>
                              <td className="w-[45%]">
                                {freeItem.name}{" "}
                                <span className="text-green-700 font-semibold">
                                  (Gratis 1 unit)
                                </span>
                              </td>
                              <td className="text-center w-[15%]">1 pcs</td>
                              <td className="text-right w-[25%]">
                                {formatCurrency(0)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Ringkasan */}
                      <div className="border-t border-black border-dashed pt-2 mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedSale.subtotal)}</span>
                        </div>
                        {selectedSale.discount_amount > 0 && (
                          <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>
                              -{formatCurrency(selectedSale.discount_amount)}
                            </span>
                          </div>
                        )}
                        {freeItem && (
                          <div className="flex justify-between">
                            <span>Free Item:</span>
                            <span>
                              {freeItem.name} (SKU: {freeItem.sku})
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>Amount Due:</span>
                          <span>{formatCurrency(selectedSale.total)}</span>
                        </div>
                      </div>

                      <div className="border-b border-black border-dashed my-2"></div>

                      {/* Footer */}
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
                    <Button
                      className="w-full text-white font-semibold"
                      style={{ background: "#009CDE" }}
                      onClick={printInvoice}
                    >
                      Cetak Invoice
                    </Button>
                  </div>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HistoryPage;
