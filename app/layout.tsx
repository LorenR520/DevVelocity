// app/layout.tsx
import "./globals.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "DevVelocity",
  description:
    "Automated enterprise cloud image deployment across AWS, Azure, GCP, Oracle, Linode, Vultr & DigitalOcean.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 antialiased">
        {/* NAVBAR */}
        <Navbar />

        {/* MAIN CONTENT WRAPPER */}
        <main className="pt-20 px-4 md:px-0">{children}</main>

        {/* FOOTER */}
        <Footer />
      </body>
    </html>
  );
}
