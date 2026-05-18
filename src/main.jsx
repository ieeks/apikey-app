import React from "react";
import { createRoot } from "react-dom/client";
import { AuthGate } from "./AuthGate";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthGate>
      {(user) => <App user={user} />}
    </AuthGate>
  </React.StrictMode>
);
