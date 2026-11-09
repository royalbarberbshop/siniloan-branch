import React from "react";
import { createRoot } from "react-dom/client";
import AuthGate from "./AuthGate.jsx";
import CustomerPage from "./CustomerPage.jsx";
import "./styles.css";

// GitHub Pages serves this app under /siniloan-branch/; route by the final path segment.
const path = window.location.pathname.replace(/\/+$/, "");
const isCustomerRoute = path.endsWith("/book");
createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isCustomerRoute ? <CustomerPage /> : <AuthGate />}</React.StrictMode>
);
