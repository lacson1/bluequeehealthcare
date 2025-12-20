import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure React is available globally
if (typeof globalThis !== 'undefined' && !(globalThis as any).React) {
    (globalThis as any).React = React;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element not found");
}

// Verify React is available before rendering
if (!React || typeof React.createElement !== 'function') {
    console.error("React is not properly loaded");
    rootElement.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: system-ui;">
      <h1 style="color: #dc2626;">System Error</h1>
      <p>React failed to load. Please refresh the page.</p>
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
} else {
    createRoot(rootElement).render(<App />);
}
