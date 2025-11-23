import "./globals.css";
import SupabaseProvider from "./supabase-provider";

export const metadata = {
  title: "DevVelocity",
  description: "Deploy cloud images across every provider instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
