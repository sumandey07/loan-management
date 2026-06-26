import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Sparkles, ArrowRight, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";

const fetchMyApplications = async (token) => {
  const res = await fetch("http://localhost:8000/applications/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
};

const fetchOffers = async (appId, token) => {
  const res = await fetch(
    `http://localhost:8000/applications/${appId}/offers`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.detail || "Failed to load offers");
  }

  const data = await res.json();
  const rawOffers = data.offers;
  if (Array.isArray(rawOffers)) return rawOffers;
  if (rawOffers?.offers) return rawOffers.offers;
  return [];
};

export default function OfferPage() {
  const { token } = useAuth();
  const { currentAppId, saveCurrentAppId } = useCurrentApplication();
  const navigate = useNavigate();
  const [selectedAppId, setSelectedAppId] = useState(
    currentAppId ? String(currentAppId) : "",
  );

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

  const selectedApp = applications.find(
    (app) => String(app.id) === selectedAppId,
  );

  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
  } = useQuery({
    queryKey: ["offers", selectedAppId],
    queryFn: () => fetchOffers(selectedAppId, token),
    enabled: Boolean(selectedAppId) && Boolean(token),
  });

  if (appsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="text-white text-lg animate-pulse">
          Loading your applications...
        </div>
      </div>
    );
  }

  if (appsError) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-10 text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            Unable to find applications
          </h2>
          <p className="text-gray-600 mb-6">
            Please create an application first.
          </p>
          <button
            onClick={() => navigate("/loan-application")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-full shadow-md">
            Go to Loan Application
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
            No applications available
          </h2>
          <p className="text-gray-600 mb-6">
            Create an application to view generated offers.
          </p>
          <button
            onClick={() => navigate("/loan-application")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-full shadow-md">
            Create Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4 py-10 mt-8">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full p-8 h-[36rem] overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs uppercase font-semibold tracking-[0.3em] text-amber-500">
              Offers dashboard
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Review and choose loan offers
            </h1>
            <p className="mt-2 text-sm text-gray-600 max-w-[46rem]">
              Select a loan application to generate offers and continue to
              document submission and finalization.
            </p>
          </div>
          <button
            onClick={() => navigate("/loan-application")}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-900 transition">
            <ArrowRight className="h-4 w-4" />
            Create New Application
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Choose application
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Pick an application no. and see its available offers.
              </p>
            </div>

            <div className="space-y-4">
              <select
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  saveCurrentAppId(Number(e.target.value));
                }}
                className="w-full rounded-3xl border border-gray-200 bg-white px-4   py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                {applications.map((application) => (
                  <option key={application.id} value={application.id}>
                    Application {application.id} — {application.status}
                  </option>
                ))}
              </select>

              {selectedApp ? (
                <div className="rounded-3xl bg-white border border-gray-200 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Application {selectedApp.id}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Collateral: {selectedApp.collateral_type}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <p>
                      Loan amount: ₹
                      {Number(selectedApp.requested_amount).toLocaleString()}
                    </p>
                    <p>Tenure: {selectedApp.tenure_years} yrs</p>
                    <p>
                      Valuation:{" "}
                      {selectedApp.valuation_estimate
                        ? `₹${Number(selectedApp.valuation_estimate).toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 w-full h-[25rem] overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Offers</h2>
                <p className="text-sm text-slate-600">
                  {offers.length} offer{offers.length === 1 ? "" : "s"}{" "}
                  generated for the selected application.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900">
                <Sparkles className="h-4 w-4" />
                Smart offer generation
              </div>
            </div>

            {offersLoading ? (
              <div className="mt-6 text-sm text-slate-600">Loading offers…</div>
            ) : offersError ? (
              <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Unable to fetch offers.
              </div>
            ) : offers.length === 0 ? (
              <div className="mt-6 text-sm text-slate-600">
                No offers available yet. Try editing the application details to
                refresh.
              </div>
            ) : (
              <div className="mt-6 h-[calc(100%-4rem)] overflow-x-auto overflow-y-hidden pb-2">
                <div className="flex h-full gap-4">
                  {offers.map((offer) => (
                    <motion.div
                      key={offer.offer_id}
                      whileHover={{ y: -3 }}
                      className="group flex min-w-[20rem] max-w-[20rem] flex-col rounded-3xl border border-slate-200 bg-zinc-950 p-5 text-white shadow-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-lg">
                            Offer {offer.offer_id}
                          </p>
                          <p className="text-sm text-slate-400">{offer.note}</p>
                        </div>
                        <div className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">
                          {offer.ltv_percent}% LTV
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-200 mb-7">
                        <p>Rate: {offer.interest_rate_annual}% p.a.</p>
                        <p>Tenure: {offer.tenure_years} years</p>
                        <p>
                          EMI: ₹{Number(offer.monthly_emi).toLocaleString()}
                        </p>
                        <p>
                          Fees: ₹{Number(offer.processing_fee).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          navigate("/upload-document", {
                            state: {
                              appId: selectedAppId,
                              offers,
                              selectedOfferId: offer.offer_id,
                              from: "offers",
                            },
                          })
                        }
                        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition group-hover:bg-amber-600">
                        <ClipboardList className="h-4 w-4" />
                        Select this offer
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
