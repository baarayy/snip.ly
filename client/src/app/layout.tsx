import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import BackgroundOrbs from "@/components/BackgroundOrbs";

export const metadata: Metadata = {
  title: "URL Shortener",
  description: "A scalable URL shortener built with microservices architecture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen relative">
        <BackgroundOrbs />
        <Navbar />
        <main className="relative z-10 pt-20">{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(21, 23, 61, 0.9)",
              color: "#F1E9E9",
              border: "1px solid rgba(152, 37, 152, 0.3)",
              backdropFilter: "blur(10px)",
            },
          }}
        />
      </body>
    </html>
  );
}
