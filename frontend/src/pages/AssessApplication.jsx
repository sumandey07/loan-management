import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListChecks, FileSearch, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";

const fetchMyApplications = async (token) => {
  const res = await fetch("http://localhost:8000/applications/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to load applications");
  }
  return res.json();
};

export default function AssessApplication() {
  const { token } = useAuth();
  const { currentAppId, saveCurrentAppId } = useCurrentApplication();
  const navigate = useNavigate();

  const [selectedAppId, setSelectedAppId] = useState(
    currentAppId ? String(currentAppId) : "",
  );
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    data: appsData,
    isLoading: appsLoading,
    error: appsError,
  } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => fetchMyApplications(token),
    enabled: Boolean(token),
  });

  const applications = useMemo(() => appsData?.applications ?? [], [appsData]);

  useEffect(() => {
    if (!selectedAppId && currentAppId) {
      setSelectedAppId(String(currentAppId));
    }
  }, [currentAppId, selectedAppId]);

  useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      setSelectedAppId(String(applications[0].id));
    }
  }, [applications, selectedAppId]);

  const handleAssess = async () => {
    if (!selectedAppId) {
      toast.error("Select an application first.");
      return;
    }

    setLoading(true);
    setAssessment(null);

    try {
      const res = await fetch(
        `http://localhost:8000/applications/${selectedAppId}/assess`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errText =
          errJson?.detail || errJson?.message || `Error ${res.status}`;
        throw new Error(errText);
      }

      const data = await res.json();
      const fetchedAssessment = data.assessment ?? data;
      setAssessment(fetchedAssessment);
      toast.success("Assessment complete");
    } catch (err) {
      toast.error(err?.message ?? "Failed to assess application");
      console.error("Assess error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (appsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="text-white text-lg font-semibold animate-pulse">
          Loading applications...
        </div>
      </div>
    );
  }

  if (appsError) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-10 text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            Unable to load applications
          </h2>
          <p className="text-gray-600 mb-6">
            Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg shadow-md">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-10 text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            No applications found
          </h2>
          <p className="text-gray-600 mb-6">
            Please create a loan application first. Once created, you can assess
            its risk and review offers.
          </p>
          <button
            onClick={() => navigate("/loan-application")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-xl shadow-md">
            Go to Loan Application
          </button>
        </div>
      </div>
    );
  }

  const selectedApp = applications.find(
    (app) => String(app.id) === selectedAppId,
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4 py-10 mt-8">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Risk assessment
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mt-4">
              Assess your Loan Application
            </h2>
            <p className="mt-2 text-sm text-gray-600 max-w-2xl">
              Pick an application and get a modern AI-powered risk score, PD
              estimate, and clearly listed reasons to help you understand risk.
            </p>
          </div>
          <button
            onClick={() => navigate("/loan-application")}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-900 transition">
            <ArrowRight className="h-4 w-4" />
            Create new application
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Select Loan application
                </p>
                <h3 className="mt-2 text-xl font-semibold text-gray-900">
                  Choose which application to assess
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <select
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  saveCurrentAppId(Number(e.target.value));
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    Application {app.id} — {app.status}
                  </option>
                ))}
              </select>

              {selectedApp ? (
                <div className="rounded-lg bg-white border border-gray-200 p-4 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">
                      Application {selectedApp.id}
                    </p>
                    <span className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                      {selectedApp.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600">
                    <p>
                      Loan amount:{" "}
                      <span className="font-semibold text-slate-900">
                        ₹{" "}
                        {Number(selectedApp.requested_amount).toLocaleString()}
                      </span>
                    </p>
                    <p>
                      Credit score:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedApp.credit_score ?? "—"}
                      </span>
                    </p>
                    <p>
                      Valuation:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedApp.valuation_estimate
                          ? `₹ ${Number(selectedApp.valuation_estimate).toLocaleString()}`
                          : "Not available"}
                      </span>
                    </p>
                    <p>
                      Collateral:{" "}
                      <span className="font-semibold text-slate-900">
                        {selectedApp.collateral_type}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              onClick={handleAssess}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
              <ListChecks className="h-4 w-4" />
              {loading ? "Assessing..." : "Assess selected application"}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Insights panel
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              What you will get
            </h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl bg-amber-500 p-2 text-black">
                  <FileSearch className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Clear loan risk</p>
                  <p className="text-sm text-slate-600">
                    Get a risk band, PD score, and updated reasons for each
                    application.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl bg-zinc-900 p-2 text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Actionable review
                  </p>
                  <p className="text-sm text-slate-600">
                    Use consistent results while comparing multiple applications
                    in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {assessment && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Assessment result
                </h3>
                <p className="text-sm text-slate-600">
                  Review the AI assessment for the selected application.
                </p>
              </div>
              <span
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${assessment.risk_level?.toLowerCase() === "high"
                  ? "bg-red-600"
                  : assessment.risk_level?.toLowerCase() === "medium"
                    ? "bg-orange-500"
                    : assessment.risk_level?.toLowerCase() === "low"
                      ? "bg-green-600"
                      : "bg-gray-500"
                  }`}>
                {assessment.risk_level ?? "N/A"} Risk
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white border border-gray-200 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  PD Score
                </p>
                <p className="mt-2 text-4xl font-bold text-gray-900">
                  {assessment.pd_score ?? "N/A"}
                </p>
              </div>
              <div className="rounded-3xl bg-white border border-gray-200 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Key reasons
                </p>
                {Array.isArray(assessment.key_reasons) &&
                  assessment.key_reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {assessment.key_reasons.map((reason, index) => (
                      <li
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No reasons returned.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/offers")}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 transition">
                View offers for this application
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
