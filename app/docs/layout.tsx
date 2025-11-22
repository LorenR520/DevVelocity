// app/docs/layout.tsx
import "../globals.css";
import DocsSidebar from "../../components/DocsSidebar";
import Breadcrumb from "../../components/Breadcrumb";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ======= TOP GRADIENT HEADER BAR ======= */}
      <div className="h-14 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-md flex items-center px-6">
        <h1 className="text-white text-lg font-semibold tracking-wide">
          DevVelocity Documentation
        </h1>
      </div>

      {/* ======= MAIN DOCS AREA ======= */}
      <div className="flex max-w-7xl mx-auto w-full py-10 px-4 gap-8">

        {/* ======= SIDEBAR ======= */}
        <aside className="hidden md:block w-64 border-r border-gray-200 bg-white shadow-sm rounded-lg p-4">
          <DocsSidebar />
        </aside>

        {/* ======= MAIN CONTENT + BREADCRUMBS ======= */}
        <main className="flex-1 bg-white shadow-sm rounded-lg p-6">

          {/* BREADCRUMB */}
          <div className="mb-6">
            <Breadcrumb />
          </div>

          {/* PAGE CONTENT */}
          <div className="prose prose-slate max-w-none">
            {children}
          </div>

        </main>
      </div>
    </div>
  );
}
