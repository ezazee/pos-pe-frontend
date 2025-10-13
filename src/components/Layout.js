import React, { useContext } from "react";
import { AuthContext } from "../App";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LogOut, ShoppingCart, History, DollarSign } from "lucide-react";
import { useLayout } from "../contexts/LayoutContext";
import Header from "./Header"; // <-- 1. IMPORT HEADER

function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { isSidebarVisible } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  // !!! PENTING: useEffect yang ada di sini sebelumnya DIHAPUS !!!

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/",
      label: "POS",
      icon: ShoppingCart,
      roles: ["admin", "cashier"],
    },
    {
      path: "/history",
      label: "Riwayat",
      icon: History,
      roles: ["admin", "finance", "cashier"],
    },
    {
      path: "/finance",
      label: "Finance",
      icon: DollarSign,
      roles: ["admin", "finance"],
    },
  ];

  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Kondisi render tetap sama */}
      {isSidebarVisible && (
        <div
          className="w-64 flex-shrink-0 shadow-lg flex flex-col"
          style={{ background: "#009CDE" }}
        >
          {/* ... Isi sidebar Anda tidak berubah ... */}
          <div className="p-6 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">PE Skinpro</h1>
            <p className="text-sm text-white/80 mt-1">Point of Sale</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-[#009CDE] font-semibold shadow-md"
                      : "text-white hover:bg-white/10"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/20">
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-white/80 text-sm mb-1">User</p>
              <p className="text-white font-semibold">{user?.name}</p>
              <p className="text-white/60 text-xs mt-1 capitalize">
                {user?.role}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-white border-white/20 hover:bg-white/10"
              data-testid="logout-btn"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Area */}
      {/* <-- 2. STRUKTUR BARU UNTUK HEADER DAN KONTEN */}
      <div className="flex-1 flex flex-col h-full">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
