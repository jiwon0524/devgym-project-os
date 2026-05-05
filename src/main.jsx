import React from "react";
import { createRoot } from "react-dom/client";
import AICompanyApp from "./AICompanyApp.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AICompanyApp />
  </React.StrictMode>
);
