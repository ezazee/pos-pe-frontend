import React, { createContext, useState, useContext } from 'react';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  return (
    <LayoutContext.Provider value={{ isSidebarVisible, setIsSidebarVisible }}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);