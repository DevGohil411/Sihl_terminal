import React from "react";
import AlgofyNav from "@/components/AlgofyNav";

export default function StrategiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-white font-sans" style={{ background: "#0B1120" }}>
      <AlgofyNav />
      {children}
    </div>
  );
}
