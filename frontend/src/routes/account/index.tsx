import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import "./App.css";
import App from "./App";

export const Route = createFileRoute("/account/")({
  component: () => <App />
});