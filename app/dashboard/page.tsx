export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">Welcome to DevVelocity</h1>

      <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
        Your command center for automated infrastructure builds, file versioning,
        and high-performance cloud architecture.
      </p>

      <div className="mt-10 space-y-4 text-gray-200">
        <p>✨ Use the sidebar to access:</p>

        <ul className="list-disc list-inside space-y-2">
          <li><span className="font-medium">AI Builder</span> — Generate infrastructure plans instantly</li>
          <li><span className="font-medium">File Portal</span> — View, update, download, and restore saved builds</li>
          <li><span className="font-medium">Billing</span> — Manage subscription and upgrade your plan</li>
        </ul>
      </div>
    </div>
  );
}
