import DocsSidebar from "@/components/DocsSidebar";
import Breadcrumb from "@/components/Breadcrumb";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0d0d13] text-white">
      <aside className="w-64 hidden md:block border-r border-white/10 bg-[#111118]">
        <DocsSidebar />
      </aside>

      <main className="flex-1 p-8">
        <Breadcrumb />
        <div className="mt-6 max-w-4xl mx-auto prose prose-invert">
          {children}
        </div>
      </main>
    </div>
  );
}
