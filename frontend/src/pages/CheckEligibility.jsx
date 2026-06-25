import { Link, useLocation } from "react-router-dom";

export default function CheckEligibility() {
  const { state } = useLocation();

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-2xl">
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
            className="mt-8 inline-flex rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
            Start again
          </Link>
        </div>
      </div>
    );
  }

  const { eligible, amount_eligible } = state;

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white p-10 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] font-semibold text-amber-600">
              Eligibility Result
            </p>
            <h1 className="mt-4 text-4xl font-semibold">Your Loan Readiness</h1>
          </div>
          <div
            className={`rounded-full px-7 py-3 text-lg font-semibold ${eligible ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {eligible ? "Eligible" : "Not eligible"}
          </div>
        </div>

        {eligible ? (
          <div className="mt-10 space-y-6 text-slate-700">
            <p className="text-lg leading-8">
              Based on your details, you qualify for a mortgage estimate. Use
              this as a starting point to compare offers and complete your
              application.
            </p>
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-900">
              <p className="text-sm uppercase tracking-[0.34em] font-semibold text-amber-500">
                Estimated loan amount
              </p>
              <p className="mt-6 text-5xl font-semibold">
                ₹{amount_eligible?.toLocaleString()}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/register"
                className="rounded-full bg-amber-400 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-amber-300">
                Register to continue
              </Link>
              <Link
                to="/loan-application"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-white/10">
                Start application
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-6 text-slate-300">
            <p className="text-lg leading-8">
              Your current profile does not meet the minimum criteria for a
              mortgage today. You can improve eligibility by increasing income,
              improving credit score, or adding a stronger collateral profile.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/"
                className="rounded-full bg-amber-400 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-amber-300">
                Re-check eligibility
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-white/10">
                Learn more options
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
