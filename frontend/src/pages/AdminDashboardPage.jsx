import React, { useState, useEffect } from "react";

export default function AdminDashboardPage() {
  const token = localStorage.getItem("admin_token");
  const [customers, setCustomers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!token) window.location.href = "/admin";

  useEffect(() => {
    async function loadData() {
      const custRes = await fetch("http://localhost:8000/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const custData = await custRes.json();

      const appRes = await fetch("http://localhost:8000/admin/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appData = await appRes.json();

      setCustomers(custData.customers);
      setApplications(appData.applications);
      setLoading(false);
    }

    loadData();
  }, [token]);

  const updateStatus = async (id, status) => {
    const fd = new FormData();
    fd.append("new_status", status);

    await fetch(
      `http://localhost:8000/admin/applications/${id}/update-status`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }
    );

    toast.info(`Application ${status}!`);
    window.location.reload();
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-xl text-gray-700">
        Loading admin panel...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold mb-6 text-gray-800 mt-10">
        Admin Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <h2 className="text-gray-500">Total Customers</h2>
          <p className="text-3xl font-bold">{customers.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <h2 className="text-gray-500">Applications</h2>
          <p className="text-3xl font-bold">{applications.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
          <h2 className="text-gray-500">Pending Approval</h2>
          <p className="text-3xl font-bold">
            {applications.filter((a) => a.status === "submitted").length}
          </p>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-10">
        <h2 className="text-xl font-semibold mb-4">Customer List</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Username</th>
              <th className="p-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.id}</td>
                <td className="p-2">{c.full_name || "N/A"}</td>
                <td className="p-2">{c.username}</td>
                <td className="p-2">{c.phone || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Applications Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Loan Applications</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">App ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-t">
                <td className="p-2">{app.id}</td>
                <td className="p-2">{app.user_id}</td>
                <td className="p-2">
                  ₹{app.requested_amount.toLocaleString()}
                </td>
                <td className="p-2">{app.status}</td>

                <td className="p-2 space-x-2">
                  {app.status === "submitted" ? (
                    <>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => updateStatus(app.id, "approved")}>
                        Approve
                      </button>

                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => updateStatus(app.id, "rejected")}>
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500 italic">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
