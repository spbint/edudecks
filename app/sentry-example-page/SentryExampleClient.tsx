"use client";

export function SentryExampleClient() {
  return (
    <main className="min-h-screen bg-[#F7F5FF] px-6 py-16 text-[#20233A]">
      <section className="mx-auto max-w-2xl rounded-3xl border border-[#E7EAF2] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6F54D9]">
          Sentry verification
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Trigger a test error</h1>
        <p className="mt-4 text-sm leading-6 text-[#5A6077]">
          This page is only for verifying Sentry in development or when explicitly enabled.
          Click the button to throw a client-side error and confirm it appears in Sentry.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-[#5E4AD6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4D3BC2] focus:outline-none focus:ring-2 focus:ring-[#5E4AD6] focus:ring-offset-2"
          onClick={() => {
            throw new Error("MyLearna Sentry test error");
          }}
        >
          Trigger test error
        </button>
      </section>
    </main>
  );
}
