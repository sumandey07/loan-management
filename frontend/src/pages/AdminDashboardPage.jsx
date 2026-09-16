import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";

export default function AdminDashboardPage() {
  const token = localStorage.getItem("admin_token");
  const adminUsername = localStorage.getItem("admin_username");
  const [customers, setCustomers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    appId: null,
    reason: "",
  });

  useEffect(() => {
    if (!token) {
      window.location.href = "/admin";
      return;
    }

    async function loadData() {
      const custRes = await fetch("http://localhost:8000/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const custData = await custRes.json();

      const appRes = await fetch("http://localhost:8000/admin/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appData = await appRes.json();

      setCustomers(custData.customers || []);
      setApplications(appData.applications || []);
      setLoading(false);
    }

    loadData();
  }, [token]);

  const updateStatus = async (id, status, rejectionReason = "") => {
    const fd = new FormData();
    fd.append("new_status", status);
    if (rejectionReason) {
      fd.append("rejection_reason", rejectionReason);
    }

    await fetch(
      `http://localhost:8000/admin/applications/${id}/update-status`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      },
    );

    toast.success(`Application ${status}`);
    window.location.reload();
  };

  const handleRejectClick = (appId) => {
    setRejectionModal({
      isOpen: true,
      appId,
      reason: "",
    });
  };

  const handleSubmitRejection = async () => {
    if (!rejectionModal.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    await updateStatus(rejectionModal.appId, "rejected", rejectionModal.reason);
    setRejectionModal({ isOpen: false, appId: null, reason: "" });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-orange-300 to-amber-700 text-white">
        <div className="rounded-lg px-8 py-6 text-xl text-white font-bold">
          Loading admin panel...
        </div>
      </div>
    );

  const submittedCount = applications.filter(
    (app) => app.status === "submitted",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-500 to-amber-800 mt-12">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-neutral-900">
              Admin Dashboard
            </p>
            <h1 className="mt-3 text-4xl text-white font-semibold tracking-tight">
              Loan Application Management
            </h1>
            <p className="mt-3 max-w-4xl text-gray-100">
              Review active customers, pending applications, and take actions on
              loan requests
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-900">
              Admin: {adminUsername || "Administrator"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 justify-center items-center flex flex-row font-bold bg-green-100 select-none px-4 py-2 text-sm text-green-500 shadow-lg">
            <LockKeyhole className="inline-block h-4 w-4 mr-2 font-bold" />
            Secure Admin View
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg text-slate-900">
            <p className="text-sm uppercase tracking-[0.28em] font-semibold text-amber-600">
              Customers
            </p>
            <p className="mt-4 text-3xl font-semibold">{customers.length}</p>
            <p className="mt-2 text-sm text-slate-600">
              Active customer accounts
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg text-slate-900">
            <p className="text-sm uppercase tracking-[0.28em] font-semibold text-amber-600">
              Applications
            </p>
            <p className="mt-4 text-3xl font-semibold">{applications.length}</p>
            <p className="mt-2 text-sm text-slate-600">Total loan requests</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg text-slate-900">
            <p className="text-sm uppercase tracking-[0.28em] font-semibold text-amber-600">
              Pending
            </p>
            <p className="mt-4 text-3xl font-semibold">{submittedCount}</p>
            <p className="mt-2 text-sm text-slate-600">Awaiting review</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="rounded-xl border border-slate-200 bg-white pt-9 pb-11 px-10 shadow-xl text-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Loan Applications</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Review and manage submitted loan applications
                </p>
              </div>
              <span className="rounded-lg bg-slate-900 px-4 py-1 text-xs uppercase tracking-[0.24em] font-semibold text-slate-100">
                {applications.length} total
              </span>
            </div>

            <div className="mt-6 overflow-x-auto overflow-y-auto max-h-[200px] pl-2 pr-6">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="sticky top-0 backdrop-blur-md">
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4">App ID</th>
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-white/5 last:border-b-0">
                      <td className="py-4 pr-4 font-medium text-slate-900">
                        {app.id}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {app.user_id}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        ₹ {Number(app.requested_amount).toLocaleString()}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${app.status === "submitted" ? "bg-teal-200 text-teal-800" : "bg-amber-200 text-amber-800"}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {app.status === "submitted" ? (
                          <div className="inline-flex gap-4">
                            <button
                              onClick={() => updateStatus(app.id, "approved")}
                              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400">
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(app.id)}
                              className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400">
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {app.status === "approved"
                              ? "✓ Approved"
                              : "✗ Rejected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white pt-8 pb-10 px-9 shadow-xl text-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Customer Snapshot</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Overview of registered customers
                </p>
              </div>
              <span className="rounded-lg bg-slate-900 px-4 py-2 text-xs uppercase font-semibold text-slate-100">
                {customers.length}
              </span>
            </div>

            <div className="mt-6 space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-lg border border-slate-400 bg-white p-4 text-slate-900">
                  <p className="font-semibold">
                    {customer.full_name || "Unknown customer"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Username: {customer.username}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Phone: {customer.phone || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Rejection Modal */}
        {rejectionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl w-96 text-slate-900">
              <h3 className="text-xl font-semibold mb-4">Reject Application</h3>
              <p className="text-sm text-slate-600 mb-4">
                Please provide a reason for rejection:
              </p>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) =>
                  setRejectionModal({
                    ...rejectionModal,
                    reason: e.target.value,
                  })
                }
                placeholder="Enter rejection reason..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-amber-500 focus:outline-none resize-none"
                rows="5"
              />
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() =>
                    setRejectionModal({
                      isOpen: false,
                      appId: null,
                      reason: "",
                    })
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRejection}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400">
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
