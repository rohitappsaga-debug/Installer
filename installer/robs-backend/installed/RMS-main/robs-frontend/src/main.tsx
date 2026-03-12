import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./App.tsx";
import "./index.css";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GlobalErrorBoundary>
);
