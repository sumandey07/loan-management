import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiry, setExpiry] = useState(null);

  // Load from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUserName = localStorage.getItem("user_name");
    const storedExpiry = localStorage.getItem("token_expiry");
    const storedRole = localStorage.getItem("auth_role");

    if (storedToken && storedExpiry && Number(storedExpiry) > Date.now()) {
      setToken(storedToken);
      setUser(storedUserName ? { name: storedUserName } : null);
      setRole(storedRole || null);
      setExpiry(Number(storedExpiry));
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("user_name");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("current_application_id");
    }
    setLoading(false);
  }, []);

  // Auto-logout when token expires (demo: 1 minute)
  useEffect(() => {
    if (!token || !expiry) return;

    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      logout();
      toast.info("Session expired. Please login again.");
      return;
    }

    const id = setTimeout(() => {
      logout();
      toast.info("Session expired. Please login again.");
    }, remaining);

    return () => clearTimeout(id);
  }, [token, expiry]);

  const login = (accessToken, options = {}) => {
    const { name, role } = options;
    // 1-minute session for demo
    const exp = Date.now() + 60 * 10000;

    setToken(accessToken);
    setUser(name ? { name } : null);
    setRole(role || null);
    setExpiry(exp);

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("token_expiry", exp.toString());
    if (name) {
      localStorage.setItem("user_name", name);
    } else {
      localStorage.removeItem("user_name");
    }
    if (role) {
      localStorage.setItem("auth_role", role);
    } else {
      localStorage.removeItem("auth_role");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    setExpiry(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("user_name");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("current_application_id");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: role === "admin",
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
