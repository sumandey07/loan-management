import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleRegister(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          phone: form.phone,
          password: form.password,
        }),
      });

      if (!res.ok) return toast.error("Registration failed");

      await res.json();
      toast.success("Account created successfully! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-orange-300 to-amber-700 flex justify-center items-center px-4 mt-6">
      <div className="max-w-6xl grid md:grid-cols-2 gap-16 items-center">
        {/* LEFT: Message */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-wide">
            Create your account
          </h2>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2">
            Start your mortgage journey
          </h1>
          <p className="mt-4 text-base md:text-lg opacity-90 leading-relaxed">
            Register once to manage applications, check eligibility, review
            risks, and generate offers for your customers.
          </p>
        </motion.div>

        {/* RIGHT: FORM CARD */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 ml-12">
          <h3 className="text-2xl font-bold mb-2 text-gray-900">
            Create an account
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Fill in your details to get started.
          </p>

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Choose a username"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile number
              </label>
              <input
                type="tel"
                name="phone"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength="10"
                required
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter your government id linked mobile no."
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Create a strong password"
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
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2.5 rounded-md text-sm mt-2 disabled:opacity-60">
              {saving ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-amber-700">
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
