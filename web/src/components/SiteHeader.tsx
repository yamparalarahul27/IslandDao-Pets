import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground text-base"
          >
            🌴
          </span>
          <span className="font-monument text-base tracking-[0.04em] uppercase">
            IslandDAO <span className="text-primary">Pets</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Discover
          </Link>
          <Link
            href="/my-pets"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            My Pets
          </Link>
          <Link
            href="/request"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Request
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
