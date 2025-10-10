import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API } from '../App';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { DollarSign, CreditCard, QrCode, TrendingUp } from 'lucide-react';

function FinancePage() {
  const { token } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    qrisTotal: 0,
    edcTotal: 0,
    transactionCount: 0
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const salesData = response.data;
      setSales(salesData);

      // Calculate stats
      const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
      const qrisTotal = salesData
        .filter(sale => sale.payment_method === 'qris')
        .reduce((sum, sale) => sum + sale.total, 0);
      const edcTotal = salesData
        .filter(sale => sale.payment_method === 'edc_debit')
        .reduce((sum, sale) => sum + sale.total, 0);

      setStats({
        totalSales,
        qrisTotal,
        edcTotal,
        transactionCount: salesData.length
      });
    } catch (error) {
      toast.error('Gagal memuat data finance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6" data-testid="finance-page">
      <h2 className="text-2xl font-bold" style={{ color: '#009CDE' }}>Dashboard Finance</h2>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Penjualan</p>
                  <p className="text-2xl font-bold" style={{ color: '#009CDE' }}>
                    {formatCurrency(stats.totalSales)}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ background: '#e0f2fe' }}>
                  <DollarSign size={24} style={{ color: '#009CDE' }} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">QRIS</p>
                  <p className="text-2xl font-bold" style={{ color: '#009CDE' }}>
                    {formatCurrency(stats.qrisTotal)}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ background: '#e0f2fe' }}>
                  <QrCode size={24} style={{ color: '#009CDE' }} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Debit EDC</p>
                  <p className="text-2xl font-bold" style={{ color: '#009CDE' }}>
                    {formatCurrency(stats.edcTotal)}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ background: '#e0f2fe' }}>
                  <CreditCard size={24} style={{ color: '#009CDE' }} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold" style={{ color: '#009CDE' }}>
                    {stats.transactionCount}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ background: '#e0f2fe' }}>
                  <TrendingUp size={24} style={{ color: '#009CDE' }} />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Breakdown Metode Pembayaran</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">QRIS</span>
                  <span className="text-sm font-medium">
                    {stats.totalSales > 0 ? Math.round((stats.qrisTotal / stats.totalSales) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      background: '#009CDE',
                      width: `${stats.totalSales > 0 ? (stats.qrisTotal / stats.totalSales) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Debit EDC</span>
                  <span className="text-sm font-medium">
                    {stats.totalSales > 0 ? Math.round((stats.edcTotal / stats.totalSales) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      background: '#0077B3',
                      width: `${stats.totalSales > 0 ? (stats.edcTotal / stats.totalSales) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default FinancePage;