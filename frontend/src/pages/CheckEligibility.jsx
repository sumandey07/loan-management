import { Link, useLocation } from "react-router-dom";

export default function CheckEligibility() {
  const { state } = useLocation();

  if (!state) {
    return (
      <div className="text-white p-10 h-screen flex flex-col items-center justify-center bg-[#ff9f1c]">
        <h1 className="font-bold text-4xl mb-6">No result found</h1>
        <Link
          to="/"
          className="mt-6 inline-block font-bold bg-white text-black px-4 py-2 rounded-md">
          Start Over
        </Link>
      </div>
    );
  }

  const { eligible, amount_eligible } = state;

  return (
    <div className="bg-[#ff9f1c] text-white h-screen flex flex-col items-center justify-center">
      {eligible ? (
        <div className="h-screen justify-center items-center text-black py-10 flex flex-col justify-center px-15 w-screen">
          <h1 className="text-4xl text-white font-bold mb-8">
            Eligibility Result
          </h1>

          <div>
            <div className="flex flex-row items-center justify-center align-middle mb-4">
              <img
                src="./src/assets/tick.jpg"
                alt="Eligibility"
                className="w-16 mb-4 bg-white rounded-full"
              />
              <span className="ml-5 text-3xl text-white font-bold -translate-y-2">
                Congratulations{" "}
              </span>
            </div>
            <div className="font-bold text-2xl text-white mb-6">
              You are Eligible for a Mortgage Loan of
            </div>
            <div className="text-white font-bold text-6xl my-12 flex justify-center items-center">
              ₹ {amount_eligible?.toLocaleString()}
            </div>
          </div>
          <div className="flex justify-center mt-4 text-lg items-center flex-col text-white font-semibold gap-6">
            For a more accurate assessment
            <div>
              <Link
                to="/register"
                className="text-xl font-semibold px-5 py-4 bg-white text-black rounded-md">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center gap-8">
          <p className="mt-3 text-4xl font-bold text-red-500">
            You are not eligible for a loan based on your inputs
          </p>

          <Link
            to="/"
            className="mt-10 bg-white text-blue-800 text-xl font-bold w-44 text-center px-4 py-3 rounded-md">
            Go Back
          </Link>
        </div>
      )}
    </div>
  );
}
