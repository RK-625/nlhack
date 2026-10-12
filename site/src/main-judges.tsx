import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Judges } from "./pages/Judges";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Judges />
  </StrictMode>,
);
