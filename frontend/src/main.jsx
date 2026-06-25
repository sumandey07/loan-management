import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CurrentApplicationProvider } from "./hooks/useCurrentApplication";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrentApplicationProvider>
        <App />
      </CurrentApplicationProvider>
    </QueryClientProvider>
  </StrictMode>,
);
