// app/docs/layout.tsx

import "../globals.css";
import DocsSidebar from "../../components/DocsSidebar";
import DocsContent from "../../components/DocsContent";
import Breadcrumb from "../../components/Breadcrumb";
import MobileSidebar from "../../components/MobileSidebar";

export const metadata = {
  title: "DevVelocity Docs",
  description: "Enterprise documentation for DevVelocity cloud images and automation.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      
      {/* SIDEBAR - Desktop only */}
      <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-neutral-800">
        <DocsSidebar />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1">
        
        {/* TOP BAR (mobile only) */}
        <div className="md:hidden p-3 border-b border-gray-200 dark:border-neutral-800">
          <MobileSidebar />
        </div>

        {/* PAGE WRAPPER */}
        <div className="max-w-3xl mx-auto px-6 py-10">

          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb />
          </div>

          {/* Docs Content Renderer */}
          <DocsContent>{children}</DocsContent>

        </div>
      </div>
    </div>
  );
}
