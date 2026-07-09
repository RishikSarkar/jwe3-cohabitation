import type { Metadata } from "next";
import { Chakra_Petch } from "next/font/google";
import { FixedBackground } from "@/components/FixedBackground";
import "./globals.css";

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra",
});

export const metadata: Metadata = {
  title: "JWE3 Enclosure Optimizer",
  description:
    "Find compatible dinosaurs for your Jurassic World Evolution 3 enclosure with minimal terrain and feeder changes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${chakra.variable} l-jwe3 min-h-screen font-sans antialiased`}
      >
        <FixedBackground />
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
