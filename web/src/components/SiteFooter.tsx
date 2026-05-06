export function SiteFooter() {
  // Vercel injects these at build time; locally they're undefined so we hide the marker.
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const repo = "yamparalarahul27/IslandDao-Pets";
  const shortSha = sha?.slice(0, 7);

  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span aria-hidden>🌴</span>
          <span>IslandDAO Pets — companions for your perks.</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={`https://github.com/${repo}`}
            className="hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <span>·</span>
          <span>Solana mainnet</span>
          {shortSha && sha && (
            <>
              <span>·</span>
              <a
                href={`https://github.com/${repo}/commit/${sha}`}
                className="font-mono text-xs hover:text-foreground"
                target="_blank"
                rel="noreferrer"
                title={`build ${sha}`}
              >
                {shortSha}
              </a>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
