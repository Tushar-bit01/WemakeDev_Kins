import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { VendorProvider } from "./context/VendorContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <VendorProvider>
        <UserProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </UserProvider>
      </VendorProvider>
    </BrowserRouter>
  </StrictMode>
);
