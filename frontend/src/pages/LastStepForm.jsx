import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";
import { toast } from "sonner";
import { ShieldCheck, FileCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const KYC_BASE = "http://localhost:8000/kyc";

export default function LastStepForm() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { currentAppId } = useCurrentApplication();

  const {
    appId: stateAppId,
    offers: offersFromState,
    selectedOfferId,
    from,
  } = location.state || {};

  const [appId, setAppId] = useState(stateAppId || currentAppId || "");
  const [origin] = useState(from || "");
  const [offers, setOffers] = useState(offersFromState || []);
  const [offerId, setOfferId] = useState(selectedOfferId || "");
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersError, setOffersError] = useState(null);
  const validOrigins = ["offers", "upload-document"];
  const originValid = validOrigins.includes(origin);

  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [file, setFile] = useState(null);

  const [otp, setOtp] = useState("");
  const [kycStep, setKycStep] = useState("INIT");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [finalSummary, setFinalSummary] = useState(null);
  const step1Complete = Boolean(offerId);
  const step2Complete = Boolean(file) || origin === "upload-document";
  const step3Active = kycStep !== "INIT";
  const stepClass = (active) =>
    active
      ? "rounded-2xl border border-amber-500/30 bg-amber-50 p-3 text-sm"
      : "rounded-2xl border border-slate-200 bg-white p-3 text-sm";

  useEffect(() => {
    if (!appId || !originValid) {
      navigate("/dashboard");
      toast.error(
        "Please continue from your dashboard or offers page to access the final step.",
      );
    }
  }, [appId, originValid, navigate]);

  useEffect(() => {
    if (!currentAppId || stateAppId) return;
    setAppId(currentAppId);
  }, [currentAppId, stateAppId]);

  useEffect(() => {
    if (!appId || offers.length > 0) return;

    const fetchOffers = async () => {
      setLoadingOffers(true);
      setOffersError(null);

      try {
        const res = await fetch(
          `http://localhost:8000/applications/${appId}/offers`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }

        const data = await res.json();
        const rawOffers = data.offers;
        setOffers(
          Array.isArray(rawOffers) ? rawOffers : (rawOffers?.offers ?? []),
        );
      } catch (e) {
        setOffersError(e.message || "Failed to load offers");
        toast.error(e.message || "Failed to load offers");
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchOffers();
  }, [appId, offers.length, token]);

  // ----------------- Validation -----------------
  const validate = () => {
    const err = {};

    if (!/^\d{12}$/.test(aadhaar)) err.aadhaar = "Invalid Aadhaar";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) err.pan = "Invalid PAN format";
    if (!offerId) err.offerId = "Select an offer";
    if (!file) err.file = "Upload document";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ----------------- STEP 1: KYC VERIFY -----------------
  const startKyc = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${KYC_BASE}/verify`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "KYC failed");

      if (data.aadhaar) {
        setKycStep("OTP");
        toast.success("OTP sent to Aadhaar-linked mobile");
      } else {
        setKycStep("VERIFIED");
        toast.success("KYC verified (PAN only)");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------- STEP 2: OTP VERIFY -----------------
  const verifyOtp = async () => {
    try {
      setSubmitting(true);

      const res = await fetch(`${KYC_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaar,
          otp: Number(otp),
          pan_verified: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      if (data.final_kyc.kyc_status !== "APPROVED") {
        throw new Error("KYC not approved");
      }

      setKycStep("VERIFIED");
      toast.success("KYC verified successfully");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------- STEP 3: FINALIZE APPLICATION -----------------
  const finalizeApplication = async (e) => {
    e.preventDefault();
    if (kycStep !== "VERIFIED") {
      toast.error("Complete KYC before submission");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("offer_id", offerId);
      formData.append("aadhaar_number", aadhaar);
      formData.append("pan_number", pan);
      formData.append("property_doc", file);

      const res = await fetch(
        `http://localhost:8000/applications/${appId}/finalize`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(`Error ${res.status}`);

      setFinalSummary(data);
      toast.success("Loan application finalized!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOffer = offers.find((offer) => offer.offer_id === offerId);

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex justify-center items-center px-4 py-8 mt-10">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Loan completion
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 mt-2">
            Finalize your application
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Complete the final verification step after selecting your offer.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className={stepClass(step1Complete)}>
              <p className="font-semibold text-slate-900">Step 1</p>
              <p className="text-slate-500">Offer selection</p>
            </div>

            <div className={stepClass(step2Complete)}>
              <p className="font-semibold text-slate-900">Step 2</p>
              <p className="text-slate-500">Document upload</p>
            </div>

            <div className={stepClass(step3Active)}>
              <p className="font-semibold text-slate-900">Step 3</p>
              <p className="text-slate-500">KYC verification</p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p>
            Application ID:{" "}
            <span className="font-mono text-slate-900">{appId}</span>
          </p>
          {loadingOffers ? (
            <p className="mt-2 text-slate-500">Loading available offers…</p>
          ) : offersError ? (
            <p className="mt-2 text-sm text-rose-600">{offersError}</p>
          ) : selectedOffer ? (
            <div className="mt-2 space-y-1 text-slate-600">
              <p>Selected offer: {selectedOffer.interest_rate_annual}% p.a.</p>
              <p>Tenure: {selectedOffer.tenure_years} years</p>
              <p>EMI: ₹{selectedOffer.monthly_emi.toLocaleString()}</p>
            </div>
          ) : (
            <p className="mt-2 text-slate-500">
              Select an offer and complete the KYC documents to submit the loan
              finalization.
            </p>
          )}
        </div>

        <form onSubmit={finalizeApplication} className="space-y-5">
          {/* Offer */}
          <div>
            <select
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
              className="w-full border rounded-full px-4 py-2">
              <option value="">Choose offer</option>
              {offers.map((o) => (
                <option key={o.offer_id} value={o.offer_id}>
                  {o.interest_rate_annual}% for {o.tenure_years} yrs
                </option>
              ))}
            </select>
            {errors.offerId && (
              <p className="mt-2 text-xs text-rose-600">{errors.offerId}</p>
            )}
          </div>

          {/* Aadhaar */}
          <div>
            <input
              type="text"
              maxLength="12"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              pattern="\d*"
              placeholder="Aadhaar (12 digits)"
              className="w-full border rounded-full px-4 py-2"
              required
            />
            {errors.aadhaar && (
              <p className="mt-2 text-xs text-rose-600">{errors.aadhaar}</p>
            )}
          </div>

          {/* PAN */}
          <div>
            <input
              type="text"
              maxLength="12"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              placeholder="PAN"
              className="w-full rounded-full border px-4 py-2"
            />
            {errors.pan && (
              <p className="mt-2 text-xs text-rose-600">{errors.pan}</p>
            )}
          </div>

          {/* File */}
          <div>
            <input
              className="border py-2 px-4 rounded-full w-full mr-8"
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {errors.file && (
              <p className="mt-2 text-xs text-rose-600">{errors.file}</p>
            )}
          </div>

          {/* KYC BUTTONS */}
          {kycStep === "INIT" && (
            <button
              type="button"
              onClick={startKyc}
              className="bg-amber-500 mr-6 px-6 py-2 rounded-full cursor-pointer">
              Start KYC
            </button>
          )}

          {kycStep === "OTP" && (
            <>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full border px-3 py-2"
              />
              <button
                type="button"
                onClick={verifyOtp}
                className="bg-amber-600 px-6 py-2 rounded-full">
                Verify OTP
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={submitting || kycStep !== "VERIFIED"}
            className="mt-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-full shadow-md disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Final Application"}
          </button>
        </form>

        {/* ----------------- FINAL SUMMARY ----------------- */}
        {finalSummary && (
          <div className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-800">
            <h3 className="text-lg font-bold mb-2">Sanction Summary</h3>
            <p>
              <span className="font-semibold">Loan ID:</span>{" "}
              {finalSummary.loan_id}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {finalSummary.status}
            </p>
            <p>
              <span className="font-semibold">Applicant:</span>{" "}
              {finalSummary.applicant_name}
            </p>
            <p className="mt-2">
              <span className="font-semibold">Selected Offer :</span>{" "}
              {finalSummary.selected_offer?.interest_rate_annual}% for{" "}
              {finalSummary.selected_offer?.tenure_years} yrs, EMI ₹
              {finalSummary.selected_offer?.monthly_emi?.toLocaleString()}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Aadhaar No. :</span>{" "}
              {finalSummary.aadhaar_number}
            </p>
            <p>
              <span className="font-semibold">PAN No. :</span>{" "}
              {finalSummary.pan_number}
            </p>
            <p className="mt-2 text-gray-600 text-xs">{finalSummary.note}</p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-full text-xs font-semibold">
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
