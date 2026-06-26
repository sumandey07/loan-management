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
  const [selectedAppId, setSelectedAppId] = useState(null);

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
    "approved",
    "rejected",
  ]);

  const pendingApps = apps.filter((a) => visibleStatuses.has(a.status || ""));

  // Set first app as selected when apps load
  useEffect(() => {
    if (pendingApps.length > 0 && !selectedAppId) {
      setSelectedAppId(pendingApps[0].id);
    }
  }, [pendingApps, selectedAppId]);

  const selectedApp = pendingApps.find((a) => a.id === selectedAppId);

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
            <h2 className="text-3xl font-bold text-gray-900 mt-4">
              Welcome, {fullName || "Bank Officer"}
            </h2>
            <p className="text-sm text-gray-600 my-5">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Pending Applications
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                You can continue saved drafts, complete uploads, or view offers
                for any active application.
              </p>
            </div>
            <button
              onClick={() => navigate("/loan-application")}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
              + New Application
            </button>
          </div>

          {/* Fixed Height Container */}
          <div className="h-96 flex flex-col">
            {pendingApps.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-600 text-center">
                  No pending applications right now. Create a new application to
                  begin.
                </p>
              </div>
            ) : (
              <>
                {/* Dropdown Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select Application
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900">
                    {pendingApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        Application #{app.id} - {app.collateral_type} - ₹
                        {Number(app.requested_amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Application Details - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  {selectedApp && (
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-gray-900">
                            Application {selectedApp.id}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            selectedApp.status === "approved"
                              ? "bg-green-100 text-green-900"
                              : selectedApp.status === "rejected"
                                ? "bg-red-100 text-red-900"
                                : "bg-amber-100 text-amber-900"
                          }`}>
                          {selectedApp.status === "approved"
                            ? "✓ Approved"
                            : selectedApp.status === "rejected"
                              ? "✗ Rejected"
                              : selectedApp.status}
                        </span>
                      </div>

                      {selectedApp.status === "rejected" &&
                        selectedApp.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-red-900 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-xs text-red-800">
                              {selectedApp.rejection_reason}
                            </p>
                          </div>
                        )}

                      <div className="space-y-1 text-sm text-gray-700">
                        <p>
                          <span className="font-semibold">Collateral:</span>{" "}
                          {selectedApp.collateral_type}
                        </p>
                        <p>
                          <span className="font-semibold">Loan Amount:</span>{" "}
                          {formatCurrency(selectedApp.requested_amount)}
                        </p>
                        <p>
                          <span className="font-semibold">Tenure:</span>{" "}
                          {selectedApp.tenure_years} years
                        </p>
                        <p>
                          <span className="font-semibold">Credit Score:</span>{" "}
                          {selectedApp.credit_score || "—"}
                        </p>
                        <p>
                          <span className="font-semibold">Existing EMI:</span>{" "}
                          {formatCurrency(selectedApp.existing_emi)}
                        </p>
                        <p>
                          <span className="font-semibold">Annual Income:</span>{" "}
                          {formatCurrency(selectedApp.annual_income)}
                        </p>
                        <p>
                          <span className="font-semibold">Region:</span>{" "}
                          {selectedApp.region}
                        </p>
                        {selectedApp.size_sqft && (
                          <p>
                            <span className="font-semibold">Size:</span>{" "}
                            {selectedApp.size_sqft} sqft
                          </p>
                        )}
                        {selectedApp.purity !== undefined &&
                          selectedApp.purity !== null && (
                            <p>
                              <span className="font-semibold">
                                Gold Purity:
                              </span>{" "}
                              {selectedApp.purity}
                            </p>
                          )}
                        {selectedApp.gold_weight_grams !== undefined &&
                          selectedApp.gold_weight_grams !== null && (
                            <p>
                              <span className="font-semibold">
                                Gold Weight:
                              </span>{" "}
                              {selectedApp.gold_weight_grams} grams
                            </p>
                          )}
                        {selectedApp.valuation_estimate !== undefined &&
                          selectedApp.valuation_estimate !== null && (
                            <p>
                              <span className="font-semibold">Valuation:</span>{" "}
                              {formatCurrency(selectedApp.valuation_estimate)}
                            </p>
                          )}
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedApp && (
                    <>
                      <button
                        className="text-xs bg-amber-500 text-black px-3 py-1.5 rounded-full font-semibold hover:bg-amber-600 transition"
                        onClick={() => handleOffers(selectedApp.id)}>
                        View Offers
                      </button>
                      {selectedApp.status === "draft" && (
                        <>
                          <button
                            className="text-xs bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
                            onClick={() => handleEdit(selectedApp.id)}>
                            Edit Application
                          </button>
                          <button
                            className="text-xs bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
                            onClick={() => {
                              saveCurrentAppId(selectedApp.id);
                              navigate("/upload-document");
                            }}>
                            Upload Documents
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
