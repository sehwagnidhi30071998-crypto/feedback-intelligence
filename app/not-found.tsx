import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="fi-page-title text-2xl">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/dashboard"
        className="fi-btn-primary mt-6"
      >
        Go to dashboard
      </Link>
    </div>
  );
}