"use client";

import React, { useState } from "react";
import { QueryClientProvider as TanStackQueryProvider } from "@tanstack/react-query";
import { createDefaultQueryClient } from "@/lib/queryClient";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createDefaultQueryClient());

  return <TanStackQueryProvider client={queryClient}>{children}</TanStackQueryProvider>;
}
