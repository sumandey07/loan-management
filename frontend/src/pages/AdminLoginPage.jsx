import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const loginAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("http://localhost:8000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) return toast.error("Invalid admin credentials");

    const data = await res.json();
    localStorage.setItem("admin_token", data.access_token);

    navigate("/admin-dashboard");
    toast.success("Admin logged in successfully");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-gray-800 to-black">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-[420px] text-white border border-white/20">
        <h1 className="text-3xl font-semibold mb-6 text-center">Admin Login</h1>

        <form onSubmit={loginAdmin} className="space-y-5">
          <input
            className="w-full p-3 rounded-lg bg-white/20 focus:bg-white/30 outline-none"
            placeholder="Admin Username"
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 rounded-lg bg-white/20 focus:bg-white/30 outline-none"
              placeholder="Admin Password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword((s) => !s)}>
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <button className="w-full bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-lg font-semibold transition">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
