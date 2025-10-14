import React, { useState, useContext } from 'react';
import { AuthContext, API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

function LoginPage() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      login(response.data.access_token, response.data.user);
      toast.success('Login berhasil!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #009CDE 0%, #0077B3 100%)' }}>
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white" data-testid="login-card">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 rounded-lg mb-4" style={{ background: '#009CDE' }}>
            <h1 className="text-3xl font-bold text-white">PE Skinpro</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Point of Sale</h2>
          <p className="text-gray-600 mt-2">Masuk ke sistem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@peskinpro.id"
              required
              className="mt-2"
              data-testid="email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2"
              data-testid="password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-6 text-lg"
            style={{ background: '#009CDE' }}
            data-testid="login-submit-btn"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-8 text-sm text-gray-600 border-t pt-6">
          <p className="font-semibold mb-2">Akun Demo:</p>
          <div className="space-y-1 text-xs">
            <p><strong>Admin:</strong> admin@peskinpro.id / Admin#123</p>
            <p><strong>Kasir:</strong> kasir@peskinpro.id / Cashier#123</p>
            <p><strong>Finance:</strong> bima@peskinpro.id / Finance#123</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;