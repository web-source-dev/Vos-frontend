"use client";

import type { ReactNode } from "react";
import { CustomerLayout } from "@/components/customer/customer-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <CustomerLayout>{children}</CustomerLayout>;
}


