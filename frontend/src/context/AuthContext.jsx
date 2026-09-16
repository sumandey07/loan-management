import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiry, setExpiry] = useState(null);

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

  // Auto-logout after three minutes without user activity.
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

  // Extend the deadline while the user is actively interacting with the app.
  useEffect(() => {
    if (!token) return;

    let lastActivity = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 1000) return;

      lastActivity = now;
      const nextExpiry = now + INACTIVITY_TIMEOUT_MS;
      setExpiry(nextExpiry);
      localStorage.setItem("token_expiry", nextExpiry.toString());
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [token]);

  const login = (accessToken, options = {}) => {
    const { name, role } = options;
    const exp = Date.now() + INACTIVITY_TIMEOUT_MS;

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
