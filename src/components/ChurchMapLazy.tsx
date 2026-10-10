"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, so it can only load in the browser.
export const ChurchMapLazy = dynamic(() => import("./ChurchMap"), {
  ssr: false,
  loading: () => <div className="muted" style={{ padding: "1rem" }}>Loading map…</div>,
});
