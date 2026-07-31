"use client";

export default function MarketplaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="marketplace-main"><div className="marketplace-state" role="alert"><strong>We could not load this Marketplace page.</strong><p>Please try again.</p><button className="marketplace-button secondary" type="button" onClick={reset}>Try again</button></div></main>; }

