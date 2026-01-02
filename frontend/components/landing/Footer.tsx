"use client";

export function Footer() {
  return (
    <footer className="py-12 px-4 bg-black border-t border-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex gap-6 text-sm text-gray-500 font-mono">
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>

        <div className="text-sm text-gray-600 font-mono">
          © {new Date().getFullYear()} Jules Clone
        </div>
      </div>
    </footer>
  );
}
