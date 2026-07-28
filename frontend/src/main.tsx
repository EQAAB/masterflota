import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryDevtools } from "./components/layout/QueryDevtools";
import { AppUpdatePoller, UpdateAvailableBanner } from "./components/layout/UpdateAvailableBanner";
import { applyDocumentBranding } from "./lib/appBranding";
import { appRouter } from "./App";
import "./index.css";

applyDocumentBranding();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppUpdatePoller />
      <UpdateAvailableBanner />
      <RouterProvider router={appRouter} />
      <QueryDevtools />
    </QueryClientProvider>
  </React.StrictMode>,
);

