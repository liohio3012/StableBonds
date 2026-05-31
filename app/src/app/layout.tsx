import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StablePay — Smart Business Payments",
  description: "Schedule vendor payments, earn interest while you wait, and guarantee on-time delivery. Your business cash works harder, automatically.",
  keywords: ["business payments", "vendor payments", "earn interest", "scheduled payments", "automated payroll"],
  openGraph: {
    title: "StablePay — Smart Business Payments",
    description: "Hold your business cash securely, earn 5% interest, and automate vendor payouts. Zero manual work required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Toaster 
          position="bottom-right" 
          richColors 
          theme="light"
          toastOptions={{
            style: {
              fontFamily: "'Inter', system-ui, sans-serif",
              borderRadius: '12px',
            },
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
