import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 p-4">
      <h1 className="text-display">404</h1>
      <p className="text-caption text-center">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}
