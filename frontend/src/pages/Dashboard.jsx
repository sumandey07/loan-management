import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ChatWidget from "../components/ChatWidget";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";

export default function Dashboard() {
  const { token } = useAuth();
  const { saveCurrentAppId } = useCurrentApplication();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [latest, setLatest] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      setErr(null);

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [dashRes, appsRes] = await Promise.all([
          fetch("http://localhost:8000/dashboard", { headers }),
          fetch("http://localhost:8000/applications/mine", { headers }),
        ]);

        if (!dashRes.ok) throw new Error(`Dashboard error ${dashRes.status}`);
        if (!appsRes.ok)
          throw new Error(`Applications error ${appsRes.status}`);

        const dashData = await dashRes.json();
        const appsData = await appsRes.json();

        setFullName(dashData.full_name || "Bank Officer");
        setLatest(dashData.latest_application ?? null);
        setApps(appsData.applications || []);
      } catch (e) {
        setErr(e.message);
        toast.error(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const visibleStatuses = new Set([
    "draft",
    "submitted",
    "verification_pending",
    "Approved (Pending Physical Verification)",
  ]);

  const pendingApps = apps.filter((a) => visibleStatuses.has(a.status || ""));

  const handleOffers = (appId) => {
    saveCurrentAppId(appId);
    navigate("/offers");
  };

  const handleContinue = handleOffers;

  const handleEdit = (appId) => {
    saveCurrentAppId(appId);
    navigate("/loan-application", { state: { mode: "edit", appId } });
  };

  const formatCurrency = (value) =>
    value !== undefined && value !== null
      ? `₹${Number(value).toLocaleString()}`
      : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex justify-center px-4 py-8 mt-14">
      <div className="max-w-6xl w-full space-y-6">
        {/* Profile / header card */}
        <div className="bg-white/95 rounded-2xl shadow-2xl p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome, {fullName || "Bank Officer"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor all mortgage applications you&apos;re handling and quickly
              continue pending cases.
            </p>
          </div>

          {latest?.id && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 w-1/4 text-sm">
              <p className="font-semibold text-amber-900 mb-1">
                Latest Application
              </p>
              <p>
                ID: <span className="font-mono">{latest.id}</span>
              </p>
              <p>Status: {latest.status}</p>
              <p>Amount: {formatCurrency(latest.requested_amount)}</p>
              <button
                className="mt-2 text-xs bg-amber-500 text-black px-3 py-1 rounded-full font-semibold"
                onClick={() => handleContinue(latest.id)}>
                Continue this application
              </button>
            </div>
          )}
        </div>

        {/* Draft and In-Progress Applications */}
        <div className="bg-white/95 rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Draft & In-Progress Applications
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                You can continue saved drafts, complete uploads, or view offers
                for any active application.
              </p>
            </div>
            <button
              onClick={() => navigate("/loan-application")}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-full font-semibold">
              + New Application
            </button>
          </div>

          {pendingApps.length === 0 ? (
            <p className="text-sm text-gray-600">
              No pending applications right now. Create a new application to
              begin.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApps.map((a) => (
                <div
                  key={a.id}
                  className="border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 space-y-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold mb-2">Application {a.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {a.status}
                    </span>
                  </div>
                  <p>Collateral: {a.collateral_type}</p>
                  <p>
                    Requested Loan Amount: {formatCurrency(a.requested_amount)}
                  </p>
                  <p>Tenure: {a.tenure_years} yrs</p>
                  <p>Credit Score: {a.credit_score || "—"}</p>
                  <p>Existing EMI: {formatCurrency(a.existing_emi)}</p>
                  <p>Annual Income: {formatCurrency(a.annual_income)}</p>
                  <p>Region: {a.region}</p>
                  {a.size_sqft && <p>Size in Sqft: {a.size_sqft} sqft</p>}
                  {a.purity !== undefined && a.purity !== null && (
                    <p>Purity of Gold: {a.purity}</p>
                  )}

                  {a.gold_weight_grams !== undefined &&
                    a.gold_weight_grams !== null && (
                      <p>Gold Weight (in grams): {a.gold_weight_grams}</p>
                    )}
                  {a.valuation_estimate !== undefined &&
                    a.valuation_estimate !== null && (
                      <p>Valuation: {formatCurrency(a.valuation_estimate)}</p>
                    )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="text-xs bg-amber-500 text-black px-3 py-1 rounded-full font-semibold"
                      onClick={() => handleOffers(a.id)}>
                      View Offers
                    </button>
                    <button
                      className="text-xs bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-full"
                      onClick={() => handleEdit(a.id)}>
                      Edit Application
                    </button>
                    <button
                      className="text-xs bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-full"
                      onClick={() => navigate("/upload-document")}>
                      Upload Documents
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
