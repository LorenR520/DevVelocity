export default function Footer() {
  return (
    <footer className="w-full p-4 bg-gray-900 text-white text-center mt-10">
      <p className="text-sm opacity-70">
        © {new Date().getFullYear()} DevVelocity — All Rights Reserved.
      </p>
    </footer>
  );
}
