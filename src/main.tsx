import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Configure PDF.js worker globally before any PDF rendering
import "./lib/pdfjsWorker";

createRoot(document.getElementById("root")!).render(<App />);
