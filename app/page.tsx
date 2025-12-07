"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to ERC-8004 page
    router.replace("/erc8004");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-red-700 font-medium">Redirecting to ERC-8004 Demo...</p>
      </div>
    </div>
  );
}