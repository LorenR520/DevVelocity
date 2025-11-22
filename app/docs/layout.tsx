// app/docs/layout.tsx

import DocsSidebar from "../../components/DocsSidebar";
import "../../globals.css";

export default function DocsLayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto w-full">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-r border-gray-200 bg-white">
        <DocsSidebar />
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
