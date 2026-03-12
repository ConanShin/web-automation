import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <h1 className="text-6xl font-bold text-gray-700">404</h1>
      <p className="mt-4 text-lg text-gray-400">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
