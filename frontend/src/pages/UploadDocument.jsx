import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCurrentApplication } from "../hooks/useCurrentApplication";

const fetchMyApplications = async (token) => {
  const res = await fetch("http://localhost:8000/applications/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
};

export default function UploadDocument() {
  const { token } = useAuth();
  const { currentAppId, saveCurrentAppId } = useCurrentApplication();
  const navigate = useNavigate();
  const [appId, setAppId] = useState(currentAppId ? String(currentAppId) : "");
  const [docType, setDocType] = useState("property_doc");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () => fetchMyApplications(token),
    enabled: Boolean(token),
  });

  const applications = useMemo(() => data?.applications ?? [], [data]);

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

  const selectedApp = applications.find((app) => String(app.id) === appId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appId) {
      toast.error("Select an application first.");
      return;
    }
    if (!file) {
      toast.error("Please choose a file");
      return;
    }
    setLoading(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("doc_type", docType);
      formData.append("file", file);

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
      setMsg(`Uploaded ${data.filename}`);
      setUploadSuccess(true);
      saveCurrentAppId(Number(appId));
      toast.success("Document uploaded successfully");
    } catch (e) {
      toast.error(e.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="text-white text-lg animate-pulse">
          Loading applications...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-10 text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">
            Upload document
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to load your applications. Please try again later.
          </p>
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
          <p className="text-gray-600 mb-6">
            Create a loan application first, then upload documents for the
            selected application.
          </p>
          <button
            onClick={() => navigate("/loan-application")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-full">
            Create Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden">
        <div className="bg-black px-8 py-6 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-amber-300">
                Document upload
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Upload documents for your loan
              </h1>
            </div>
            <button
              onClick={() => navigate("/loan-application")}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition">
              <ArrowRight className="h-4 w-4" />
              Create new application
            </button>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-slate-200">
            Upload key documents securely for the selected application and move
            to final KYC verification with confidence.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 text-slate-900">
                <UploadCloud className="h-6 w-6" />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    Upload step
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Choose application and file
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Select the application you want to attach documents to, then
                upload a document file for verification.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Application
                </label>
                <select
                  value={appId}
                  onChange={(e) => {
                    setAppId(e.target.value);
                    saveCurrentAppId(Number(e.target.value));
                  }}
                  className="w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.id} — {app.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Document type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN</option>
                  <option value="salary_slip">Salary Slip</option>
                  <option value="bank_statement">Bank Statement</option>
                  <option value="property_doc">Property Document</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Choose file
                </label>
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-amber-500" />
                  <p className="mt-3 text-sm text-slate-600">
                    Drag & drop or click to upload your document
                  </p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mt-4 w-full cursor-pointer text-sm text-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60">
                {loading ? "Uploading..." : "Upload document"}
              </button>
            </form>

            {msg && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <p>{msg}</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-black">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-700">
                  Quick info
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                  Document upload benefits
                </h2>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <p>
                • Upload documents once and use them for KYC and final
                submission.
              </p>
              <p>• We support PDFs and images for easy upload.</p>
              <p>
                • After upload, continue directly to the final submission step.
              </p>
            </div>
            <button
              onClick={() =>
                navigate("/last-step", {
                  state: { appId, from: "upload-document" },
                })
              }
              disabled={!uploadSuccess}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
              Continue to final step
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
