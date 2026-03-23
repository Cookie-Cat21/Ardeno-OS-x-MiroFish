import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.style.setProperty("color-scheme", "dark");

createRoot(document.getElementById("root")!).render(<App />);
