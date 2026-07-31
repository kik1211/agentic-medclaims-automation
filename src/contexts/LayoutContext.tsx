import React, { createContext, useContext } from 'react';

interface LayoutContextType {
  isAppLayout: boolean;
}

const LayoutContext = createContext<LayoutContextType>({ isAppLayout: false });

export const LayoutProvider: React.FC<{ isAppLayout: boolean; children: React.ReactNode }> = ({
  isAppLayout,
  children,
}) => <LayoutContext.Provider value={{ isAppLayout }}>{children}</LayoutContext.Provider>;

export const useLayoutContext = () => useContext(LayoutContext);
