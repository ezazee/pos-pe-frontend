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
  }, []);

const fetchSales = async () => {
  setLoading(true);
  try {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to   = dateTo;
    if (invoiceNo && invoiceNo.trim()) params.invoice = invoiceNo.trim(); // NEW

    const res = await axios.get(`${API}/sales`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    setSales(res.data);
  } catch (e) {
    toast.error('Gagal memuat riwayat transaksi');
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

      const data = sales.map((sale) => ({
        "No. Invoice": sale.invoice_no,
        Tanggal: sale.date,
        Waktu: sale.time,
        Kasir: sale.cashier_name,
        "Jumlah Item": sale.items.length,
        Subtotal: sale.subtotal,
        Diskon: sale.discount_amount,
        Total: sale.total,
        "Metode Pembayaran":
          sale.payment_method === "qris" ? "QRIS" : "Debit EDC",
        Status: sale.status,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 10 },
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
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-4" data-testid="history-page">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#009CDE" }}>
          Riwayat Transaksi
        </h2>

        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
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
          <div className="flex-1">
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
          {/* NEW: No. Invoice */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              No. Invoice
            </label>
            <Input
              placeholder="mis. JKT-01-202510-000123"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSales()}
              data-testid="invoice-filter-input"
            />
          </div>
          <Button
            onClick={fetchSales}
            disabled={loading}
            data-testid="filter-btn"
          >
            <Filter className="mr-2" size={16} />
            Filter
          </Button>
          {canExport && (
            <Button
              onClick={exportToExcel}
              style={{ background: "#009CDE", color: "white" }}
              data-testid="export-excel-btn"
              disabled={!sales?.length} // opsional: nonaktif kalau kosong
              title={!sales?.length ? "Tidak ada data" : "Ekspor ke Excel"}
            >
              <Download className="mr-2" size={16} />
              Ekspor Excel
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Tidak ada transaksi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">No. Invoice</th>
                  <th className="text-left py-3 px-2">Tanggal</th>
                  <th className="text-left py-3 px-2">Kasir</th>
                  <th className="text-center py-3 px-2">Item</th>
                  <th className="text-right py-3 px-2">Subtotal</th>
                  <th className="text-right py-3 px-2">Diskon</th>
                  <th className="text-right py-3 px-2">Total</th>
                  <th className="text-center py-3 px-2">Metode</th>
                  <th className="text-center py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b hover:bg-gray-50"
                    data-testid={`sale-row-${sale.id}`}
                  >
                    <td className="py-3 px-2 font-mono text-sm">
                      {sale.invoice_no}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {sale.date} {sale.time}
                    </td>
                    <td className="py-3 px-2">{sale.cashier_name}</td>
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
