export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-white px-6">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <p className="text-gray-400 text-lg mb-6">
        The page you're looking for doesn’t exist or has been moved.
      </p>

      <a
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
      >
        Return to Dashboard
      </a>
    </main>
  );
}
