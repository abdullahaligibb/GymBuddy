import React from "react";
import { createRoot } from "react-dom/client";
import { GymBuddyApp } from "../../App";
import { createHttpApi } from "../../src/services/httpApi";

// Test entry only. Production configuration comes from EXPO_PUBLIC_API_*.
const query = new URLSearchParams(window.location.search);
const api = createHttpApi(query.get("api")!, { contract: query.get("contract") === "legacy" ? "legacy" : "v1" });
createRoot(document.getElementById("root")!).render(<GymBuddyApp api={api} />);
