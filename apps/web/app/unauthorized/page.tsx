import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm space-y-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Akses ditolak
        </p>
        <h1 className="text-2xl font-bold">Anda tidak punya akses ke halaman ini.</h1>
        <p className="text-sm text-muted-foreground">
          Masuk dengan akun yang sesuai atau kembali ke dashboard utama.
        </p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ke dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-sm border border-border px-4 py-2 text-sm font-medium"
          >
            Login ulang
          </Link>
        </div>
      </div>
    </main>
  );
}
