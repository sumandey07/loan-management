import React from "react";
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="h-screen gap-9 flex flex-col justify-center items-center">
      <div className="font-semibold text-4xl">404 | Not Found</div>
      <div className="flex flex-col text-center text-xl gap-4">
        The page you are looking for does not exist or has been moved.
        <div>
          Go back to the{" "}
          <Link to="/" className="font-bold hover:text-blue-500">
            Home
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
