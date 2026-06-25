import { motion } from "framer-motion";
import { useState } from "react";
import { FaPercent, FaUserCheck, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ChatWidget from "../components/ChatWidget";

export default function HomePage() {
  const [income, setIncome] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        if (!value) msg = "Credit Score is required";
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
    setError(null);

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
      toast.info("Eligibility checking done!");
    } catch (err) {
      setError(err.message || "Request failed");
      toast.error("Eligibility Checking failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white bg-linear-to-r from-orange-300 to-amber-700 min-h-screen mt-12">
      <header className="relative w-full h-[480px]">
        <img
          src="./src/assets/family.png"
          alt="hero"
          className="w-full h-full object-cover mask-b-from-98% mask-t-from-98%"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Text Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-32 left-16 text-white max-w-lg">
          <h2 className="text-4xl font-bold leading-snug">
            Unlock Your Mortgage Loan Potential. Check Your Eligibility in
            Minutes.
          </h2>

          <p className="mt-3 text-gray-200">
            Check your mortgage loan potential. Find out if you qualify
            instantly.
          </p>
        </motion.div>

        {/* -------------------- Eligibility Card -------------------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-[-130px] left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl p-6 w-1/2">
          <h3 className="text-xl font-bold mt-2 mb-5 text-black">
            Mortgage Loan Eligibility Check
          </h3>

          <form onSubmit={checkEligibility} className="flex flex-col gap-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => {
                    setIncome(e.target.value);
                    validateFields("income", e.target.value);
                  }}
                  className={`peer w-full border rounded-md px-3 py-3 text-black focus:outline-none 
      ${errors.income ? "border-red-500" : "border-gray-400"}
    `}
                  placeholder="Enter your Annual Income"
                />

                <p
                  className={`text-red-600 text-xs mt-1 h-[16px] ${
                    errors.income ? "visible" : "invisible"
                  }`}>
                  {errors.income || ""}
                </p>
              </div>

              <div className="relative">
                <select
                  value={creditScore}
                  onChange={(e) => {
                    setCreditScore(e.target.value);
                    validateFields("creditScore", e.target.value);
                  }}
                  className="peer text-sm text-black w-full border rounded-md px-3 py-4 focus:outline-none border-gray-400">
                  <option value="">Estimated Credit Score</option>
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
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    validateFields("age", e.target.value);
                  }}
                  className={`peer w-full border rounded-md px-3 py-3.5 text-black focus:outline-none 
      ${errors.age ? "border-red-500" : "border-gray-400"}
      `}
                  placeholder="Enter your age"
                />

                <p
                  className={`text-red-600 text-xs mt-1 h-[16px] ${
                    errors.age ? "visible" : "invisible"
                  }`}>
                  {errors.age || ""}
                </p>
              </div>
            </div>
            <div className="mx-auto">
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
                className="w-60 border text-center text-base cursor-pointer border-zinc-400 font-semibold shadow-2xl bg-white text-black rounded-lg px-3 py-3 transition disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Checking..." : "Check Eligibility"}
              </button>
            </div>
          </form>
        </motion.div>
      </header>

      {/* -------------------- FEATURES SECTION -------------------- */}
      <div className="mt-32 flex justify-center gap-20 px-10 py-10">
        {/* Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center max-w-xs">
          <FaUserCheck className=" text-4xl mb-3" />
          <h4 className="font-semibold text-lg">How It Works</h4>
          <p className="">
            Learn how income & credit score shape loan eligibility.
          </p>
        </motion.div>

        {/* Feature 2 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-col items-center text-center max-w-xs">
          <FaPercent className=" text-4xl mb-3" />
          <h4 className="font-semibold text-lg">Competitive Rates</h4>
          <p className="">Get insights into competitive mortgage options.</p>
        </motion.div>

        {/* Feature 3 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col items-center text-center max-w-xs">
          <FaUserTie className="text-4xl mb-3" />
          <h4 className="font-semibold text-lg">Trusted Advisors</h4>
          <p className="">Work with trusted financial experts.</p>
        </motion.div>
      </div>

      <ChatWidget />
    </div>
  );
}
