import DocsSidebar from "../../components/DocsSidebar";
import "../../globals.css";
import Navbar from "../../components/Navbar";
import Breadcrumb from "../../components/Breadcrumb";

export default function DocsLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-neutral-800">
          <DocsSidebar />
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6">
          <Breadcrumb />
          {children}
        </div>
      </div>
    </div>
  );
}
