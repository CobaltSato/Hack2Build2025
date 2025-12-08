import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trustless Agents",
  description: "ERC-8004 Trustless Agent Protocol with on-chain evaluation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </body>
    </html>
  );
}
