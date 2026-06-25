import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [openProfile, setOpenProfile] = useState(false);
  const [openLoginMenu, setOpenLoginMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    setOpenLoginMenu(false);
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const onUserLogin = () => {
    setOpenLoginMenu(false);
    navigate("/login");
  };

  const onAdminLogin = () => {
    setOpenLoginMenu(false);
    navigate("/admin");
  };

  const isAdminView = location.pathname.startsWith("/admin");

  const showLoginButton =
    !isAuthenticated &&
    !isAdminView &&
    location.pathname !== "/login" &&
    location.pathname !== "/admin";

  const showRegisterButton =
    !isAuthenticated && !isAdminView && location.pathname !== "/register";

  if (isAdminView) {
    return (
      <nav className="w-full bg-linear-to-r from-orange-400 to-amber-600 text-white shadow-md z-40 fixed top-0 left-0">
        <div className="max-w-7xl mx-auto flex justify-between py-3">
          {/* LEFT: brand */}
          <div className="flex items-center gap-2">
            <img src="./src/assets/mortgage.png" alt="logo" className="w-7" />
            <Link to="/" className="font-bold text-lg tracking-wide">
              Mortgage Loan Finance
            </Link>
          </div>

          {/* RIGHT: Admin + Logout */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-100 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full bg-linear-to-r from-orange-400 to-amber-600 text-white shadow-md z-40 fixed top-0 left-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="./src/assets/mortgage.png" alt="logo" className="w-7" />
          <Link to="/" className="font-bold text-lg tracking-wide">
            Mortgage Loan Finance
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Link
            to="/loan-application"
            className={`text-sm font-semibold ${
              isActive("/loan-application")
                ? "bg-amber-700 py-2 px-3 rounded-full"
                : ""
            }`}>
            Application
          </Link>

          <Link
            to="/offers"
            className={`text-sm font-semibold ${
              isActive("/offers") ? "bg-amber-700 py-2 px-3 rounded-full" : ""
            }`}>
            Offers
          </Link>

          <Link
            to="/assess-application"
            className={`text-sm font-semibold hidden md:inline ${
              isActive("/assess-application")
                ? "bg-amber-700 py-2 px-3 rounded-full"
                : ""
            }`}>
            Assess
          </Link>

          {!isAuthenticated && (
            <>
              {showLoginButton && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenLoginMenu((p) => !p)}
                    className="text-sm font-semibold border border-white/80 px-4 py-1.5 rounded-full hover:bg-white hover:text-black transition">
                    Login
                  </button>

                  {openLoginMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg py-2 text-sm">
                      <button
                        onClick={onUserLogin}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        User Login
                      </button>
                      <button
                        onClick={onAdminLogin}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        Admin Login
                      </button>
                    </div>
                  )}
                </div>
              )}

              {showRegisterButton && (
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-black px-4 py-1.5 rounded-full hover:bg-gray-900 transition">
                  Register
                </Link>
              )}
            </>
          )}

          {/* LOGGED IN USER: Profile + Logout */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setOpenProfile((p) => !p)}
                className="w-9 h-9 rounded-full bg-black/20 border border-white/60 flex items-center justify-center text-sm font-bold uppercase">
                {(user?.name || "U").charAt(0)}
              </button>

              {openProfile && (
                <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded-lg shadow-lg py-2 text-sm">
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setOpenProfile(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100">
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
