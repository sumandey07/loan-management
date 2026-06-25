import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FaPercent, FaUserCheck, FaUserTie } from "react-icons/fa";

export default function HomePage() {
  const [income, setIncome] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    income: "",
    creditScore: "",
    age: "",
  });
  const navigate = useNavigate();

  const validateFields = (name, value) => {
    let msg = "";

    switch (name) {
      case "income":
        if (!value) msg = "Income is required";
        else if (value < 300000) msg = "Minimum income should be ₹3,00,000";
        break;
      case "creditScore":
        if (!value) msg = "Credit score is required";
        break;
      case "age":
        if (!value) msg = "Age is required";
        else if (value < 18 || value > 100)
          msg = "Age must be between 18 and 100";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  const checkEligibility = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        age: parseInt(age, 10),
        annual_income: parseFloat(income),
        credit_score: parseInt(creditScore, 10),
      };

      const res = await fetch("http://localhost:8000/checkEligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return toast.error(`Server error: ${res.status}`);

      const data = await res.json();
      navigate("/eligibility", { state: data });
      toast.success("Eligibility check complete");
    } catch (err) {
      toast.error(err.message || "Failed to check eligibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 text-white">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.25),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_30%)]">
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.45fr_1fr] items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8">
              <div className="max-w-xl">
                <p className="text-sm uppercase tracking-[0.32em] text-amber-300">
                  Mortgage intelligence
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Clear home loan guidance for every step of your journey.
                </h1>
                <p className="mt-6 text-base leading-8 text-slate-300">
                  Discover your mortgage eligibility, compare offers, and move
                  forward with confidence using a simple, expert-led experience.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 text-slate-900">
                  <p className="text-sm text-slate-500">Fast insight</p>
                  <p className="mt-3 text-2xl font-semibold">Minutes</p>
                </div>
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 text-slate-900">
                  <p className="text-sm text-slate-500">Mortgage focus</p>
                  <p className="mt-3 text-2xl font-semibold">Purpose-built</p>
                </div>
                <div className="rounded-[30px] border border-slate-200 bg-white p-5 text-slate-900">
                  <p className="text-sm text-slate-500">Responsible lending</p>
                  <p className="mt-3 text-2xl font-semibold">Transparent</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl text-slate-900">
              <p className="text-sm uppercase tracking-[0.32em] text-amber-200">
                Eligibility check
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Simple, reliable mortgage readiness
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Enter your income, credit score, and age to see whether you
                qualify for a home loan estimate.
              </p>

              <form onSubmit={checkEligibility} className="mt-8 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="sr-only" htmlFor="income">
                      Annual income
                    </label>
                    <input
                      id="income"
                      type="number"
                      value={income}
                      onChange={(e) => {
                        setIncome(e.target.value);
                        validateFields("income", e.target.value);
                      }}
                      className={`w-full rounded-3xl border px-4 py-3 text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.income ? "border-red-500" : "border-slate-300"}`}
                      placeholder="Annual income"
                    />
                    <p
                      className={`mt-2 text-xs ${errors.income ? "text-red-400" : "text-slate-500"}`}>
                      {errors.income || "Minimum ₹3,00,000"}
                    </p>
                  </div>

                  <div>
                    <label className="sr-only" htmlFor="creditScore">
                      Credit score
                    </label>
                    <select
                      id="creditScore"
                      value={creditScore}
                      onChange={(e) => {
                        setCreditScore(e.target.value);
                        validateFields("creditScore", e.target.value);
                      }}
                      className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <option value="">Credit score range</option>
                      <option value="0">0-99</option>
                      <option value="100">100-199</option>
                      <option value="200">200-299</option>
                      <option value="300">300-399</option>
                      <option value="400">400-499</option>
                      <option value="500">500-599</option>
                      <option value="600">600-699</option>
                      <option value="700">700-799</option>
                      <option value="800">800-900</option>
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      Choose your nearest bracket
                    </p>
                  </div>

                  <div>
                    <label className="sr-only" htmlFor="age">
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        validateFields("age", e.target.value);
                      }}
                      className={`w-full rounded-3xl border px-4 py-3 text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.age ? "border-red-500" : "border-slate-300"}`}
                      placeholder="Age"
                    />
                    <p
                      className={`mt-2 text-xs ${errors.age ? "text-red-400" : "text-slate-500"}`}>
                      {errors.age || "18–100 years"}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    errors.income ||
                    errors.age ||
                    errors.creditScore ||
                    !income ||
                    !age ||
                    !creditScore
                  }
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Checking..." : "Check eligibility"}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-lg text-slate-900">
            <p className="text-sm uppercase tracking-[0.32em] text-amber-300">
              Mortgage clarity
            </p>
            <h3 className="mt-4 text-xl font-semibold">
              Start with secure, data-driven insights.
            </h3>
            <p className="mt-3 text-slate-400">
              Understand your position before you apply so you can choose offers
              with confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-lg text-slate-900">
            <p className="text-sm uppercase tracking-[0.32em] text-amber-300">
              Competitive terms
            </p>
            <h3 className="mt-4 text-xl font-semibold">
              Compare offers that match your needs.
            </h3>
            <p className="mt-3 text-slate-400">
              See the difference between rate, tenure, and EMI before
              committing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-lg text-slate-900">
            <p className="text-sm uppercase tracking-[0.32em] text-amber-300">
              Expert support
            </p>
            <h3 className="mt-4 text-xl font-semibold">
              Move forward with trusted guidance.
            </h3>
            <p className="mt-3 text-slate-400">
              A smarter process for your home loan application and documents.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
