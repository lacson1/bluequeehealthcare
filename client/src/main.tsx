import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling and logging
console.log("Bluequee Healthcare Platform - Starting application...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; font-family: Arial;">ERROR: Root element not found</div>';
} else {
  console.log("Root element found, mounting React app...");
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("React app mounted successfully!");
  } catch (error) {
    console.error("Error mounting React app:", error);
    document.body.innerHTML = `<div style="padding: 20px; font-family: Arial; background: #fee; border: 1px solid #fcc;">
      <h2>Application Error</h2>
      <p>Failed to start the healthcare platform.</p>
      <pre>${error}</pre>
    </div>`;
  }
}
