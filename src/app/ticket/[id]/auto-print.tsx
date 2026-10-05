"use client";

import { useEffect } from "react";

// Lance la boîte de dialogue d'impression à l'ouverture du ticket
export default function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);
  return null;
}