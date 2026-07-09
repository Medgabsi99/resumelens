"use client";

import dynamic from "next/dynamic";
import React from "react";

const ApplicationTracker = dynamic(() => import("@/components/ApplicationTracker"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted">Loading Applications...</div>,
});

export default function ClientApplicationTracker() {
  return <ApplicationTracker />;
}
