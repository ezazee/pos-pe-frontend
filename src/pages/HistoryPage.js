import React, { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import axios from "axios";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Download, Filter } from "lucide-react";

function HistoryPage() {
  const { token, user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (invoiceNo && invoiceNo.trim()) params.invoice = invoiceNo.trim();

      const res = await axios.get(`${API}/sales`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data);
    } catch (e) {
      toast.error("Gagal memuat riwayat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const canExport = user && (user.role === "admin" || user.role === "finance");

  const exportToExcel = async () => {
    if (!canExport) {
      toast.error("Anda tidak memiliki akses untuk mengekspor");
      return;
    }
    if (!sales || sales.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      // ✅ TAMBAHKAN KOLOM BARU DI SINI
      const data = sales.map((sale) => ({
        "No. Invoice": sale.invoice_no,
        Tanggal: sale.date,
        Waktu: sale.time,
        Kasir: sale.cashier_name,
        "Nama Pelanggan": sale.customer_name || "-",
        "Jumlah Item": sale.items.length,
        Subtotal: sale.subtotal,
        Diskon: sale.discount_amount,
        Total: sale.total,
        "Metode Pembayaran":
          sale.payment_method === "qris" ? "QRIS" : "Debit EDC",
        "Bank (QRIS)":
          sale.payment_method === "qris" ? sale.qris_acquirer || "-" : "",
        Status: sale.status,
      }));

      const ws = XLSX.utils.json_to_sheet(data);

      // ✅ SESUAIKAN LEBAR KOLOM (TOTAL 12 KOLOM)
      ws["!cols"] = [
        { wch: 20 }, // No. Invoice
        { wch: 12 }, // Tanggal
        { wch: 10 }, // Waktu
        { wch: 15 }, // Kasir
        { wch: 20 }, // Nama Pelanggan
        { wch: 12 }, // Jumlah Item
        { wch: 15 }, // Subtotal
        { wch: 15 }, // Diskon
        { wch: 15 }, // Total
        { wch: 18 }, // Metode Pembayaran
        { wch: 15 }, // Bank (QRIS)
        { wch: 10 }, // Status
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

      const now = new Date();
      const filename = `PE-Skinpro_Transactions_${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(
        now.getHours()
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
        now.getSeconds()
      ).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success("File Excel berhasil diunduh");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor ke Excel");
    }
  };

  const formatCurrency = (amount) => {
    return `Rp ${Number(amount).toLocaleString("id-ID")}`;
  };

  return (
    <div className="p-4 space-y-4" data-testid="history-page">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#009CDE" }}>
          Riwayat Transaksi
        </h2>

        {/* --- Bagian Filter (Tidak Diubah) --- */}
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-1 block">
              Dari Tanggal
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="date-from-input"
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
              data-testid="date-to-input"
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
              data-testid="invoice-filter-input"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchSales}
              disabled={loading}
              data-testid="filter-btn"
            >
              <Filter className="mr-2" size={16} /> Filter
            </Button>
            {canExport && (
              <Button
                onClick={exportToExcel}
                style={{ background: "#009CDE", color: "white" }}
                data-testid="export-excel-btn"
                disabled={!sales?.length}
                title={!sales?.length ? "Tidak ada data" : "Ekspor ke Excel"}
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
        ) : sales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Tidak ada transaksi yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                {/* ✅ TAMBAHKAN HEADER BARU DI SINI */}
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
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b hover:bg-gray-50"
                    data-testid={`sale-row-${sale.id}`}
                  >
                    <td className="py-3 px-2 font-mono">{sale.invoice_no}</td>
                    <td className="py-3 px-2">
                      {sale.date} {sale.time}
                    </td>
                    <td className="py-3 px-2">{sale.cashier_name}</td>
                    <td className="py-3 px-2">{sale.customer_name || "-"}</td>
                    <td className="py-3 px-2 text-center">
                      {sale.items.length}
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
                    {/* ✅ TAMPILKAN DATA BARU DI SINI */}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default HistoryPage;
