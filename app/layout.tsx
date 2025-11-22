// app/layout.tsx
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: "DevVelocity – Cloud Images & DevOps Environments",
  description: "Enterprise-grade prebuilt cloud environments for AWS, Azure, GCP, OCI, Linode, DigitalOcean, and Vultr.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
