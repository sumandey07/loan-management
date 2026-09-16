import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";

export default function LoanApplicationPage() {
  const { token } = useAuth();
  const { currentAppId, saveCurrentAppId } = useCurrentApplication();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [collateralType, setCollateralType] = useState("property");
  const [commonForm, setCommonForm] = useState({
    requested_amount: "50000",
    tenure_years: "1",
    credit_score: "300",
    existing_emi: "0",
    annual_income: "",
    region: "",
  });

  const [propertyForm, setPropertyForm] = useState({ size_sqft: "" });
  const [goldForm, setGoldForm] = useState({
    gold_weight_grams: "",
    purity: "",
  });
  const [loading, setLoading] = useState(false);

  const locationState = location.state || {};
  const pageMode = locationState.mode || "new";
  const stateAppId =
    locationState.appId || (pageMode === "edit" ? currentAppId : null);
  const [editingAppId] = useState(stateAppId || "");

  const isEdit = pageMode === "edit" && Boolean(editingAppId);
  const isGold = collateralType === "gold";
  const actionLabel = isEdit ? "Update Application" : "Submit Application";
  const loadingLabel = isEdit ? "Updating..." : "Submitting...";

  const handleCommonChange = (field) => (e) => {
    const value = e.target.value;
    if (field === "tenure_years") {
      if (value === "") {
        setCommonForm((prev) => ({ ...prev, [field]: "" }));
        return;
      }

      const numeric = Number(value);
      if (Number.isNaN(numeric)) return;
      const clamped = Math.max(1, Math.min(30, numeric));
      setCommonForm((prev) => ({ ...prev, [field]: String(clamped) }));
      return;
    }

    if (field === "credit_score") {
      if (value === "") {
        setCommonForm((prev) => ({ ...prev, credit_score: "" }));
        return;
      }

      // Allow only digits while typing
      if (!/^\d*$/.test(value)) return;

      setCommonForm((prev) => ({
        ...prev,
        credit_score: value,
      }));
      return;
    }

    if (field === "region") {
      const sanitized = value.replace(/[^A-Za-z\s]/g, "");
      setCommonForm((prev) => ({ ...prev, region: sanitized }));
      return;
    }

    setCommonForm((prev) => ({ ...prev, [field]: value }));
  };
  const handlePropertyChange = (field) => (e) =>
    setPropertyForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handleGoldChange = (field) => (e) =>
    setGoldForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isCommonValid =
    commonForm.requested_amount.trim() !== "" &&
    commonForm.tenure_years.trim() !== "" &&
    commonForm.credit_score.trim() !== "" &&
    Number(commonForm.credit_score) >= 300 &&
    Number(commonForm.credit_score) <= 900 &&
    commonForm.region.trim().length >= 2 &&
    /^[A-Za-z\s]+$/.test(commonForm.region.trim());

  const isCollateralValid = isGold
    ? goldForm.gold_weight_grams.trim() !== "" && goldForm.purity.trim() !== ""
    : propertyForm.size_sqft.trim() !== "";

  const isFinancialValid =
    commonForm.existing_emi.trim() !== "" &&
    commonForm.annual_income.trim() !== "";

  const isFormValid = isCommonValid && isCollateralValid && isFinancialValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setResult(null);

    try {
      const payload = {
        collateral_type: collateralType,
        ...commonForm,
        ...(isGold ? goldForm : propertyForm),
      };

      const url = isEdit
        ? `http://localhost:8000/applications/${editingAppId}`
        : "http://localhost:8000/applications";

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      saveCurrentAppId(data.application_id);
    } catch (err) {
      setErr(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEdit || !editingAppId) return;

    async function load() {
      const res = await fetch(
        `http://localhost:8000/applications/${editingAppId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      setCollateralType(data.collateral_type);
      setCommonForm({
        requested_amount: String(data.requested_amount ?? ""),
        tenure_years: String(data.tenure_years ?? ""),
        credit_score: String(data.credit_score ?? ""),
        existing_emi: String(data.existing_emi ?? ""),
        annual_income: String(data.annual_income ?? ""),
        region: String(data.region ?? ""),
      });

      setPropertyForm({ size_sqft: String(data.size_sqft ?? "") });
      setGoldForm({
        gold_weight_grams: String(data.gold_weight_grams ?? ""),
        purity: String(data.purity ?? ""),
      });
    }

    load();
  }, [editingAppId, isEdit, token]);

  return (
    <div className="min-h-screen bg-linear-to-r from-orange-300 to-amber-700 flex justify-center items-center px-4 py-8 mt-10">
      <div className="bg-white/95 rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        {isEdit ? (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Update Mortgage Loan Application
          </h2>
        ) : (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Mortgage Loan Application
          </h2>
        )}
        {isEdit ? (
          <p className="text-sm text-gray-600 mb-6 mt-2">
            Update the applicant's financials and collateral details. We'll
            compute valuation and use this later for risk &amp; offers.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-6 mt-2">
            Enter the applicant's financials and collateral details. We'll
            compute valuation and use this later for risk &amp; offers.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Collateral type + requested amount */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.9fr_1fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collateral Type
              </label>
              <select
                onChange={(e) => setCollateralType(e.target.value)}
                name="collateral_type"
                value={collateralType}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="property">Property</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested Loan Amount (₹)
              </label>
              <input
                type="number"
                name="requested_amount"
                min={50000}
                max={500000000}
                value={commonForm.requested_amount}
                onChange={(e) =>
                  setCommonForm({
                    ...commonForm,
                    requested_amount: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. 2500000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenure (years)
              </label>
              <input
                type="number"
                name="tenure_years"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                min={1}
                max={30}
                value={commonForm.tenure_years}
                onChange={handleCommonChange("tenure_years")}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1.4fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Score (CIBIL)
              </label>
              <input
                type="number"
                name="credit_score"
                min={300}
                max={900}
                step="1"
                value={commonForm.credit_score}
                onChange={handleCommonChange("credit_score")}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. 750"
              />
              <p className="pl-1 mt-2 text-xs text-slate-500">
                Credit score must be between 300 and 900.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region / City
              </label>
              <input
                type="text"
                name="region"
                inputMode="text"
                value={commonForm.region}
                onChange={handleCommonChange("region")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. Gurgaon"
                required
              />
              <p className="pl-1 mt-2 text-xs text-slate-500">
                Use letters and spaces only.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Monthly EMI (₹)
              </label>
              <input
                type="number"
                min={0}
                name="existing_emi"
                value={commonForm.existing_emi}
                onChange={handleCommonChange("existing_emi")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0 if none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Income (₹)
              </label>
              <input
                type="number"
                name="annual_income"
                value={commonForm.annual_income}
                onChange={handleCommonChange("annual_income")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g. 1200000"
                required
              />
            </div>
            {collateralType === "property" && (
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Size (sq ft)
                  </label>
                  <input
                    type="number"
                    name="size_sqft"
                    value={propertyForm.size_sqft}
                    onChange={handlePropertyChange("size_sqft")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 1200"
                    required
                  />
                </div>
              </div>
            )}
            {collateralType === "gold" && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gold Purity
                  </label>
                  <select
                    name="purity"
                    defaultValue=""
                    value={goldForm.purity}
                    onChange={handleGoldChange("purity")}
                    className="peer text-gray-700 text-sm text-black w-full border rounded-md px-3 py-2 focus:outline-none border-gray-400"
                    required>
                    <option value="" disabled>
                      Select purity
                    </option>
                    <option value="22k">22k</option>
                    <option value="24k">24k</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gold Weight in Grams
                  </label>
                  <input
                    type="number"
                    name="gold_weight_grams"
                    value={goldForm.gold_weight_grams}
                    onChange={handleGoldChange("gold_weight_grams")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 12"
                    required
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            {err && <div className="text-sm text-red-600">Error: {err}</div>}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="ml-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold px-5 py-2.5 rounded-xl shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? loadingLabel : actionLabel}
            </button>
          </div>
        </form>
        {result && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold mb-1">
              Application created successfully!
            </p>
            <p>
              Application ID:{" "}
              <span className="font-mono">{result.application_id}</span>
            </p>
            <p>
              Valuation Estimate:{" "}
              {result.valuation_estimate
                ? `₹${result.valuation_estimate.toLocaleString()}`
                : "N/A"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/assess-application")}
                className="bg-black text-white px-4 py-2 rounded-lg text-xs font-semibold">
                Assess Risk
              </button>
              <button
                onClick={() => navigate("/offers")}
                className="bg-white border border-amber-400 text-black px-4 py-2 rounded-lg text-xs font-semibold">
                View Offers
              </button>
              <button
                onClick={() => navigate("/upload-document")}
                className="bg-black text-white px-4 py-2 rounded-lg text-xs font-semibold">
                Upload Documents
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-xs font-semibold">
                Go to Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
