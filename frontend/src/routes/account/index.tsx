import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
// import { useState } from "react";

function Account() {}
export const Route = createFileRoute("/account/")({
  component: Account,
});
