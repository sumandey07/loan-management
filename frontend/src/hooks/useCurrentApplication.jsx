import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "current_application_id";

const CurrentApplicationContext = createContext(null);

export function CurrentApplicationProvider({ children }) {
  const [currentAppId, setCurrentAppId] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const saveCurrentAppId = (id) => {
    if (!Number.isFinite(id)) return;
    localStorage.setItem(STORAGE_KEY, String(id));
    setCurrentAppId(id);
  };

  const clearCurrentAppId = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentAppId(null);
  };

  return (
    <CurrentApplicationContext.Provider
      value={{ currentAppId, saveCurrentAppId, clearCurrentAppId }}>
      {children}
    </CurrentApplicationContext.Provider>
  );
}

export function useCurrentApplication() {
  const ctx = useContext(CurrentApplicationContext);
  if (!ctx) {
    throw new Error(
      "useCurrentApplication must be used inside CurrentApplicationProvider",
    );
  }
  return ctx;
}
