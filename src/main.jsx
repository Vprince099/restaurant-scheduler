import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const el = document.getElementById("root");
if (!el) {
  document.body.innerHTML = "<pre>Mount point #root was not found.</pre>";
} else {
  createRoot(el).render(<App />);
}
