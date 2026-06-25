import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-300 to-amber-700 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.36em] font-semibold text-amber-600">
          Page missing
        </p>
        <h1 className="mt-6 text-6xl font-semibold tracking-tight">404</h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          The page you are looking for is unavailable. Return to the home page
          and continue your mortgage journey.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          Go back home
        </Link>
      </div>
    </div>
  );
}
