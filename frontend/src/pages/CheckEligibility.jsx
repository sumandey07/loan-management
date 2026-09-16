import { Link, useLocation } from "react-router-dom";

export default function CheckEligibility() {
  const { state } = useLocation();

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-10 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.36em] text-amber-300">
            Eligibility result
          </p>
          <h1 className="mt-6 text-4xl font-semibold">No result found</h1>
          <p className="mt-4 text-slate-300">
            We could not display your loan eligibility. Please start over with
            your income and credit details.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
            Start again
          </Link>
        </div>
      </div>
    );
  }

  const { eligible, amount_eligible } = state;

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white mt-6 p-10 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] font-semibold text-amber-600">
              Eligibility Result
            </p>
            <h1 className="mt-4 text-4xl font-semibold">Your Loan Readiness</h1>
          </div>
          <div
            className={`rounded-xl px-5 py-2 text-md font-semibold ${eligible ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {eligible ? "Eligible" : "Not Eligible"}
          </div>
        </div>

        {eligible ? (
          <div className="mt-8 space-y-6 text-slate-700">
            <p className="text-lg leading-8 my-6">
              Based on your details, you qualify for a mortgage estimate. Use
              this as a starting point to compare offers and complete your
              application.
            </p>
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-900">
              <p className="text-sm uppercase tracking-[0.34em] font-semibold text-amber-500">
                Estimated loan amount
              </p>
              <p className="mt-6 text-5xl font-semibold">
                ₹{amount_eligible?.toLocaleString()}
              </p>
            </div>
            <div className="grid gap-12 my-8 sm:grid-cols-2">
              <Link
                to="/register"
                className="rounded-xl bg-amber-400 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-amber-300">
                Register to Continue
              </Link>
              <Link
                to="/"
                className="rounded-xl border border-slate-400 bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-white/10">
                Check for other offers
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 mb-6 space-y-16">
            <p className="text-lg text-slate-500 leading-8">
              Your current profile does not meet the minimum criteria for a
              mortgage today. You can improve eligibility by increasing income,
              improving credit score, or adding a stronger collateral profile.
            </p>
            <div className="text-center">
              <Link
                to="/"
                className="rounded-xl bg-amber-400 px-8 py-4 font-semibold transition hover:bg-amber-300">
                Re-check eligibility
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
