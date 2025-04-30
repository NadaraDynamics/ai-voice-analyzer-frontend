import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { MaterialUIControllerProvider } from "./context"; // <-- add this

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <MaterialUIControllerProvider> {/* <-- wrap with this */}
        <AppRoutes />
      </MaterialUIControllerProvider>
    </AuthProvider>
  </BrowserRouter>
);
