import Image from "next/image";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Image
        src="/icons/apple-touch-icon.png"
        alt="Empire Apartments"
        width={80}
        height={80}
        className="rounded-xl"
        priority
      />
      <div>
        <h1 className="font-serif text-2xl text-foreground">You&apos;re offline</h1>
        <p className="mt-2 max-w-sm text-muted">
          Check your connection, then reopen the app or try again.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-medium text-[var(--gold-foreground)] transition-opacity hover:opacity-90"
      >
        Try again
      </Link>
    </main>
  );
}
