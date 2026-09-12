"use client";
import React from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // Login disabled for development/demo: direct access to all modules
  return <>{children}</>;
}
