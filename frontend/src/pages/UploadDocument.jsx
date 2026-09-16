import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";
import { getUserApplicationNumber } from "../utils/applicationNumber";

const KYC_BASE = "http://localhost:8000/kyc";

const fetchMyApplications = async (token) => {
  const res = await fetch("http://localhost:8000/applications/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
};

export default function UploadDocumentNew() {
  const { token } = useAuth();
  const { currentAppId, saveCurrentAppId } = useCurrentApplication();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    appId: stateAppId,
    offers: offersFromState,
    selectedOfferId,
  } = location.state || {};

  // ============ State Management ============
  const [appId, setAppId] = useState(
    stateAppId || (currentAppId ? String(currentAppId) : ""),
  );

  // Document upload states
  const [salarySlipFile, setSalarySlipFile] = useState(null);
  const [bankStatementFile, setBankStatementFile] = useState(null);
  const [propertyOrGoldFile, setPropertyOrGoldFile] = useState(null);
  const [docs, setDocs] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({
    salary_slip: null,
    bank_statement: null,
    property_gold: null,
  });

  // Offer and KYC states
  const [offers, setOffers] = useState(offersFromState || []);
  const [offerId] = useState(selectedOfferId || "");
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Aadhaar, PAN states
  const [aadhaar1, setAadhaar1] = useState("");
  const [aadhaar2, setAadhaar2] = useState("");
  const [aadhaar3, setAadhaar3] = useState("");
  const [pan, setPan] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  // OTP verification
  const [otp, setOtp] = useState("");
  const [kycStep, setKycStep] = useState("INIT");

  // UI states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [finalSummary, setFinalSummary] = useState(null);
  const [currentStep, setCurrentStep] = useState("documents");

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => fetchMyApplications(token),
    enabled: Boolean(token),
  });

  const applications = useMemo(() => data?.applications ?? [], [data]);

  // ============ Effects ============
  useEffect(() => {
    if (!appId && currentAppId) {
      setAppId(String(currentAppId));
    }
  }, [currentAppId, appId]);

  useEffect(() => {
    if (!appId && applications.length > 0) {
      setAppId(String(applications[0].id));
    }
  }, [applications, appId]);

  // Load offers
  useEffect(() => {
    if (!appId || offers.length > 0) return;

    const fetchOffers = async () => {
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
        const offersArray = Array.isArray(rawOffers)
          ? rawOffers
          : (rawOffers?.offers ?? []);
        setOffers(offersArray);
      } catch (e) {
        toast.error(e.message || "Failed to load offers");
      }
    };

    fetchOffers();
  }, [appId, offers.length, token]);

  useEffect(() => {
    if (!offerId || offers.length === 0) return;
    const selected = offers.find((o) => String(o.offer_id) === String(offerId));
    if (selected) {
      setSelectedOffer(selected);
    }
  }, [offerId, offers]);

  // Load uploaded documents
  useEffect(() => {
    if (!appId) return;

    const fetchDocs = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/applications/${appId}/documents`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error(`Failed to load documents: ${res.status}`);
        const data = await res.json();
        setDocs(data.documents || []);

        // Categorize docs
        const categorized = {
          salary_slip: null,
          bank_statement: null,
          property_gold: null,
        };
        (data.documents || []).forEach((doc) => {
          if (doc.doc_type === "salary_slip") categorized.salary_slip = doc;
          else if (doc.doc_type === "bank_statement")
            categorized.bank_statement = doc;
          else if (["property_doc", "gold_doc"].includes(doc.doc_type))
            categorized.property_gold = doc;
        });
        setUploadedDocs(categorized);
      } catch (e) {
        console.error(e);
      }
    };

    fetchDocs();
  }, [appId, token]);

  // ============ Validation & Helpers ============
  const getAadhaarString = () => aadhaar1 + aadhaar2 + aadhaar3;
  const allDocumentsUploaded = Boolean(
    uploadedDocs.salary_slip &&
    uploadedDocs.bank_statement &&
    uploadedDocs.property_gold,
  );

  const validate = (forReview = false) => {
    const err = {};

    const aadhaarStr = getAadhaarString();
    if (!/^\d{12}$/.test(aadhaarStr)) err.aadhaar = "Aadhaar must be 12 digits";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) err.pan = "Invalid PAN format";
    if (!/^\d{10,18}$/.test(bankAccount))
      err.bankAccount = "Invalid bank account";
    if (forReview && !offerId) err.offerId = "Select an offer";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ============ Document Upload ============
  const uploadDocument = async (docType, file) => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("doc_type", docType);
      formData.append("file", file);
      const existingDocCategory =
        docType === "salary_slip"
          ? "salary_slip"
          : docType === "bank_statement"
            ? "bank_statement"
            : "property_gold";
      if (uploadedDocs[existingDocCategory]?.id) {
        formData.append("document_id", uploadedDocs[existingDocCategory].id);
      }

      const res = await fetch(
        `http://localhost:8000/applications/${appId}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      // Update uploaded docs
      const docCategory = existingDocCategory;

      setUploadedDocs((prev) => ({
        ...prev,
        [docCategory]: {
          id: data.doc_id,
          filename: data.filename,
          display_filename: data.display_filename,
          doc_type: docType,
          size_bytes: data.size_bytes || file.size || 0,
        },
      }));
      setDocs((prev) => {
        const updated = {
          id: data.doc_id,
          filename: data.filename,
          display_filename: data.display_filename,
          doc_type: docType,
          size_bytes: data.size_bytes || file.size || 0,
        };
        return prev.some((doc) => doc.id === updated.id)
          ? prev.map((doc) => (doc.id === updated.id ? updated : doc))
          : [...prev, updated];
      });

      toast.success(`${docType.replace("_", " ")} uploaded successfully`);

      // Reset file inputs
      if (docType === "salary_slip") setSalarySlipFile(null);
      else if (docType === "bank_statement") setBankStatementFile(null);
      else setPropertyOrGoldFile(null);
    } catch (e) {
      toast.error(e.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  // ============ KYC Steps ============
  const startKyc = async () => {
    if (!validate() || !allDocumentsUploaded) {
      if (!allDocumentsUploaded) {
        toast.error("All documents must be uploaded first");
      }
      return;
    }

    try {
      setSubmitting(true);
      const aadhaarStr = getAadhaarString();
      const payload = new FormData();
      payload.append("aadhaar", aadhaarStr);
      payload.append("pan", pan);
      payload.append("bank_account", bankAccount);

      const res = await fetch(`${KYC_BASE}/verify`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "KYC failed");

      if (data.aadhaar_otp) {
        setKycStep("OTP_AADHAAR");
        toast.success("OTP sent to Aadhaar-linked mobile");
      } else {
        setKycStep("VERIFIED");
        toast.success("KYC verified (PAN + Bank Account)");
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("aadhaar", getAadhaarString());
      payload.append("otp", otp);

      const res = await fetch(`${KYC_BASE}/verify-otp`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "OTP verification failed");

      if (data.final_kyc?.kyc_status !== "APPROVED") {
        throw new Error("KYC not approved");
      }

      setKycStep("VERIFIED");
      toast.success("OTP verified successfully");
      setOtp("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============ Final Submission ============
  const finalizeApplication = async (e) => {
    e.preventDefault();
    if (kycStep !== "VERIFIED") {
      toast.error("Complete KYC before submission");
      return;
    }

    try {
      setSubmitting(true);

      const selectedDocId =
        uploadedDocs.property_gold?.id ||
        docs.find((doc) => ["property_doc", "gold_doc"].includes(doc.doc_type))?.id;

      const formData = new FormData();
      formData.append("offer_id", offerId);
      formData.append("aadhaar_number", getAadhaarString());
      formData.append("pan_number", pan);
      if (selectedDocId) {
        formData.append("selected_doc_id", selectedDocId);
      }

      const res = await fetch(
        `http://localhost:8000/applications/${appId}/finalize`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.detail || data?.message || `Error ${res.status}`;
        throw new Error(message);
      }

      setFinalSummary(data);
      saveCurrentAppId(Number(appId));
      toast.success("Loan application finalized!");
    } catch (e) {
      toast.error(e.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  // ============ Render Helpers ============
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    return `${Math.round(bytes / 1024)} KB`;
  };

  const DocUploadCard = ({ title, docType, file, setFile, uploaded }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {uploaded && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
      </div>

      <div>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-3 w-full"
        />
        {file && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Selected file: <span className="font-semibold break-all">{file.name}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => uploadDocument(docType, file)}
          disabled={!file || loading}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-600 disabled:opacity-60">
          {loading ? "Uploading..." : uploaded ? `Update ${title}` : `Upload ${title}`}
        </button>
      </div>
      {uploaded && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 mt-6">
          <p className="text-sm text-emerald-900">
            <strong className="break-words">
              {uploaded.display_filename || uploaded.filename}
            </strong>
            <br />
            <span className="text-xs text-emerald-700">
              {formatFileSize(uploaded.size_bytes)}
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );

  // ============ Loading & Error States ============
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="text-white text-lg font-semibold animate-pulse">
          Loading Applications...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-10 text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Error</h2>
          <p className="text-gray-600 mb-6">Unable to load applications.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-full">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-10 text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            No applications yet
          </h2>
          <button
            onClick={() => navigate("/loan-application")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-full">
            Create Application
          </button>
        </div>
      </div>
    );
  }

  // ============ Main Render ============
  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4 py-10 mt-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-black px-8 py-6 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-amber-300">
                Final Loan Submission
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Complete your application
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-200">
            Upload required documents, verify your details, and finalize your
            loan application.
          </p>
        </div>

        <div className="p-8 space-y-8">
          {!finalSummary ? (
            <>
              {/* Step Indicators */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div
                  className={`rounded-lg border p-3 text-sm ${currentStep === "documents"
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-200 bg-white"
                    }`}>
                  <p className="font-semibold text-slate-900">Step 1</p>
                  <p className="text-slate-500">Document upload</p>
                </div>
                <div
                  className={`rounded-lg border p-3 text-sm ${currentStep === "kyc"
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-200 bg-white"
                    }`}>
                  <p className="font-semibold text-slate-900">Step 2</p>
                  <p className="text-slate-500">KYC verification</p>
                </div>
                <div
                  className={`rounded-lg border p-3 text-sm ${currentStep === "review"
                    ? "border-amber-500 bg-amber-50"
                    : "border-slate-200 bg-white"
                    }`}>
                  <p className="font-semibold text-slate-900">Step 3</p>
                  <p className="text-slate-500">Review & Submit</p>
                </div>
              </div>

              {/* Step 1: Document Upload */}
              {currentStep === "documents" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6">
                  <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
                    <div className="flex items-center gap-3">
                      <UploadCloud className="h-6 w-6" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                          Step 1
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                          Upload Required Documents
                        </h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      All documents are mandatory. Upload income proof, bank
                      documents, and property/gold documents.
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <DocUploadCard
                      title="Income Proof"
                      docType="salary_slip"
                      file={salarySlipFile}
                      setFile={setSalarySlipFile}
                      uploaded={uploadedDocs.salary_slip}
                    />
                    <DocUploadCard
                      title="Bank Documents"
                      docType="bank_statement"
                      file={bankStatementFile}
                      setFile={setBankStatementFile}
                      uploaded={uploadedDocs.bank_statement}
                    />
                    <DocUploadCard
                      title="Property/Gold Doc"
                      docType="property_doc"
                      file={propertyOrGoldFile}
                      setFile={setPropertyOrGoldFile}
                      uploaded={uploadedDocs.property_gold}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!allDocumentsUploaded) {
                        toast.error("All documents must be uploaded");
                        return;
                      }
                      setCurrentStep("kyc");
                    }}
                    disabled={!allDocumentsUploaded}
                    className="w-full rounded-lg bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-2">
                    Continue to verification
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: KYC Verification */}
              {currentStep === "kyc" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6">
                  <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                          Step 2
                        </p>
                        <h2 className="text-xl font-semibold text-slate-900">
                          Identity verification
                        </h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">
                      Enter your Aadhaar, PAN, and bank account details for
                      verification.
                    </p>
                  </div>

                  <form className="space-y-5">
                    {/* Aadhaar (3x4) */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Aadhaar Number (12 digits)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength="4"
                          value={aadhaar1}
                          onChange={(e) =>
                            setAadhaar1(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="0000"
                          className="w-1/3 rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-mono"
                        />
                        <input
                          type="text"
                          maxLength="4"
                          value={aadhaar2}
                          onChange={(e) =>
                            setAadhaar2(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="0000"
                          className="w-1/3 rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-mono"
                        />
                        <input
                          type="text"
                          maxLength="4"
                          value={aadhaar3}
                          onChange={(e) =>
                            setAadhaar3(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="0000"
                          className="w-1/3 rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-mono"
                        />
                      </div>
                      {errors.aadhaar && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.aadhaar}
                        </p>
                      )}
                    </div>

                    {/* PAN */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        maxLength="10"
                        value={pan}
                        onChange={(e) =>
                          setPan(e.target.value.toUpperCase().slice(0, 10))
                        }
                        placeholder="AAAAA0000A"
                        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-mono"
                      />
                      {errors.pan && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.pan}
                        </p>
                      )}
                    </div>

                    {/* Bank Account */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) =>
                          setBankAccount(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Enter account number"
                        className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm"
                      />
                      {errors.bankAccount && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.bankAccount}
                        </p>
                      )}
                    </div>

                    {/* KYC buttons */}
                    {kycStep === "INIT" && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!validate()) {
                            toast.error("Fix the errors before proceeding");
                            return;
                          }
                          await startKyc();
                        }}
                        disabled={submitting}
                        className="w-full rounded-lg bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60">
                        {submitting ? "Verifying..." : "Start KYC Verification"}
                      </button>
                    )}

                    {kycStep === "OTP_AADHAAR" && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            OTP sent to your Aadhaar-linked mobile
                          </label>
                          <input
                            type="text"
                            maxLength="6"
                            value={otp}
                            onChange={(e) =>
                              setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="Enter 6-digit OTP"
                            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={verifyOtp}
                          disabled={submitting || !otp || otp.length !== 6}
                          className="w-full rounded-lg bg-amber-600 px-5 py-3 font-semibold text-black hover:bg-amber-700 disabled:opacity-60">
                          {submitting ? "Verifying..." : "Verify OTP"}
                        </button>
                      </>
                    )}

                    {kycStep === "VERIFIED" && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <p>KYC verification completed successfully!</p>
                        </div>
                      </div>
                    )}
                  </form>

                  <div className="flex justify-around gap-16">
                    <button
                      onClick={() => setCurrentStep("documents")}
                      className="flex-1 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (kycStep !== "VERIFIED") {
                          toast.error("Complete KYC first");
                          return;
                        }
                        setCurrentStep("review");
                      }}
                      disabled={kycStep !== "VERIFIED"}
                      className="flex-1 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-600 disabled:opacity-60">
                      Continue to review
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === "review" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6">
                  {/* Selected Offer */}
                  <div className="rounded-xl border border-gray-200 bg-slate-50 p-6">
                    <div className="mb-4">
                      <p className="mb-3 text-sm font-semibold text-slate-700">
                        Chosen offer
                      </p>
                      {errors.offerId && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.offerId}
                        </p>
                      )}
                    </div>

                    {/* Offer Details - Read Only */}
                    {offerId && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="grid gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Offer ID:</span>
                            <span className="font-semibold text-slate-900">
                              {offerId}
                            </span>
                          </div>
                          {selectedOffer && (
                            <>
                              <div className="flex justify-between border-t border-amber-200 pt-3">
                                <span className="text-slate-600">
                                  Interest Rate:
                                </span>
                                <span className="font-semibold text-slate-900">
                                  {selectedOffer.interest_rate_annual}% p.a.
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Tenure:</span>
                                <span className="font-semibold text-slate-900">
                                  {selectedOffer.tenure_years} years
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Monthly EMI:</span>
                                <span className="font-bold text-amber-700">
                                  ₹{selectedOffer.monthly_emi?.toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Final Review Summary */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 font-semibold text-slate-900">
                      Application Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-slate-600">Aadhaar:</span>
                        <span className="font-mono ml-2">
                          {aadhaar1}****{aadhaar3.slice(-2)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-600">PAN:</span>
                        <span className="font-mono ml-2">
                          {pan[0]}XXXX{pan.slice(-1)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-600">Bank Account:</span>
                        <span className="font-mono ml-2">
                          XXXX{bankAccount.slice(-4)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <form onSubmit={finalizeApplication} className="space-y-3">
                    <button
                      type="submit"
                      disabled={!offerId || submitting}
                      className="w-full rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                      {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("kyc")}
                      className="w-full rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                      Back
                    </button>
                  </form>
                </motion.div>
              )}
            </>
          ) : (
            // Final Success Summary
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 p-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Application Submitted!
                </h3>
                <p className="mt-2 text-slate-600">
                  Your loan application has been successfully submitted for
                  admin review.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-6 text-left">
                <p className="mb-4 text-sm font-semibold text-slate-700">
                  Loan Details:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-slate-600">Loan ID:</span>
                    <span className="font-mono ml-2 font-semibold">
                      {finalSummary?.loan_id}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-600">Status:</span>
                    <span className="ml-2 font-semibold text-amber-600">
                      {finalSummary?.status}
                    </span>
                  </p>
                  {finalSummary?.selected_offer && (
                    <p>
                      <span className="text-slate-600">Offer:</span>
                      <span className="ml-2 font-semibold">
                        {finalSummary.selected_offer.interest_rate_annual}% for{" "}
                        {finalSummary.selected_offer.tenure_years} years
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-slate-900">
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
