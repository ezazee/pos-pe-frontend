import React from "react";
import { useLayout } from "../contexts/LayoutContext";
import { Button } from "./ui/button";
import { Menu } from "lucide-react"; // Gunakan ikon Menu sebagai hamburger

function Header() {
  const { setIsSidebarVisible } = useLayout();

  // Fungsi untuk toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-10 flex items-center h-16 bg-white shadow-sm px-4 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="text-gray-600 hover:text-gray-900"
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </Button>
      {/* Anda bisa menambahkan judul halaman atau elemen lain di sini jika perlu */}
    </header>
  );
}

export default Header;
