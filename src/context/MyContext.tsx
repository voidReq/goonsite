"use client";
import React, { createContext, useContext, useState } from 'react';

interface ContextType {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}

const MyContext = createContext<ContextType | null>(null);

export const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [value, setValue] = useState('default value');

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
  return useContext(MyContext);
};