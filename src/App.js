import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import LoginPage from "./pages/LoginPage";
import POSPage from "./pages/POSPage";
import HistoryPage from "./pages/HistoryPage";
import FinancePage from "./pages/FinancePage";
import Layout from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import "./App.css";
import { LayoutProvider } from "./contexts/LayoutContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token and get user
      axios
        .get(`${API}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <LayoutProvider>
          <Routes>
            <Route
              path="/login"
              element={!token ? <LoginPage /> : <Navigate to="/" />}
            />
            <Route
              path="/*"
              element={
                token ? (
                  <Layout>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          user?.role === "admin" || user?.role === "cashier" ? (
                            <POSPage />
                          ) : (
                            <Navigate to="/history" />
                          )
                        }
                      />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/finance" element={<FinancePage />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </LayoutProvider>
      </BrowserRouter>
      {/* <Toaster position="top-right" /> */}
    </AuthContext.Provider>
  );
}

export default App;
