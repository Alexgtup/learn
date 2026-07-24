import React from "react";
import ReactDOM from "react-dom/client";
import "highlight.js/styles/atom-one-dark.css";
import "./styles.css";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
