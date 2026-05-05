export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span aria-hidden>🌴</span>
          <span>IslandDAO Pets — companions for your perks.</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/yamparalarahul27/IslandDao-Pets"
            className="hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span>·</span>
          <span>Solana mainnet</span>
        </div>
      </div>
    </footer>
  );
}
