"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SpritePlayer } from "@/components/SpritePlayer";
import { useWalletSession } from "@/components/providers/WalletSessionProvider";
import { ROW_SPECS } from "@/lib/types";
import { isCurrentWalletAdmin, searchPerks } from "./actions";

type SelectedPerk = {
  mint: string;
  name: string;
  imageUrl: string;
};

type ParsedPetJson = {
  id: string;
  displayName: string;
  description: string;
};

export default function AdminUploadPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { isVerified, verifying, hydrating, verify, expSeconds } =
    useWalletSession();

  const [adminCheck, setAdminCheck] = useState<
    { kind: "loading" } | { kind: "yes" } | { kind: "no"; wallet: string }
  >({ kind: "loading" });

  // Re-check admin allowlist whenever the verified wallet changes.
  useEffect(() => {
    if (!isVerified || !publicKey) {
      setAdminCheck({ kind: "loading" });
      return;
    }
    let cancelled = false;
    const wallet = publicKey.toBase58();
    isCurrentWalletAdmin(wallet)
      .then((ok) => {
        if (cancelled) return;
        setAdminCheck(ok ? { kind: "yes" } : { kind: "no", wallet });
      })
      .catch(() => {
        if (!cancelled) setAdminCheck({ kind: "no", wallet });
      });
    return () => {
      cancelled = true;
    };
  }, [isVerified, publicKey]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Upload Pet
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Drop a hatched Codex pet and link it to a PERK NFT.
        </p>
      </header>

      {hydrating && <SkeletonGate />}

      {!hydrating && !connected && (
        <Gate
          icon={<Wallet className="size-6" />}
          title="Admin only"
          body="Connect a wallet to continue."
          cta={
            <Button onClick={() => setVisible(true)}>
              <Wallet className="size-4" /> Connect wallet
            </Button>
          }
        />
      )}

      {!hydrating && connected && !isVerified && (
        <Gate
          icon={<AlertTriangle className="size-6" />}
          title="Verify your wallet"
          body="One signature unlocks the admin tools for 24 hours."
          cta={
            <Button onClick={() => verify()} disabled={verifying}>
              {verifying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {verifying ? "Waiting on wallet…" : "Sign to verify"}
            </Button>
          }
        />
      )}

      {!hydrating && connected && isVerified && adminCheck.kind === "loading" && (
        <SkeletonGate />
      )}

      {!hydrating &&
        connected &&
        isVerified &&
        adminCheck.kind === "no" && (
          <Gate
            icon={<Lock className="size-6" />}
            title="Not authorized"
            body={
              <>
                <span className="font-mono text-foreground">
                  {short(adminCheck.wallet)}
                </span>{" "}
                isn&apos;t an admin wallet.
              </>
            }
          />
        )}

      {!hydrating &&
        connected &&
        isVerified &&
        adminCheck.kind === "yes" &&
        publicKey && (
          <UploadForm
            wallet={publicKey.toBase58()}
            expSeconds={expSeconds ?? 0}
          />
        )}
    </div>
  );
}

function short(s: string) {
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function SkeletonGate() {
  return (
    <div className="rounded-2xl border bg-card/40 p-10 text-center">
      <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Gate({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card/40 p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-5 flex justify-center">{cta}</div>}
    </div>
  );
}

function UploadForm({
  wallet,
  expSeconds,
}: {
  wallet: string;
  expSeconds: number;
}) {
  const router = useRouter();

  const [petJsonFile, setPetJsonFile] = useState<File | null>(null);
  const [parsedPetJson, setParsedPetJson] = useState<ParsedPetJson | null>(
    null,
  );
  const [petJsonError, setPetJsonError] = useState<string | null>(null);

  const [spriteFile, setSpriteFile] = useState<File | null>(null);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);

  const [perk, setPerk] = useState<SelectedPerk | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Read pet.json client-side for preview.
  useEffect(() => {
    if (!petJsonFile) {
      setParsedPetJson(null);
      setPetJsonError(null);
      return;
    }
    let cancelled = false;
    petJsonFile.text().then((text) => {
      if (cancelled) return;
      try {
        const json = JSON.parse(text);
        if (
          typeof json.id === "string" &&
          typeof json.displayName === "string"
        ) {
          setParsedPetJson({
            id: json.id,
            displayName: json.displayName,
            description: typeof json.description === "string" ? json.description : "",
          });
          setPetJsonError(null);
        } else {
          setParsedPetJson(null);
          setPetJsonError("missing id or displayName");
        }
      } catch {
        setParsedPetJson(null);
        setPetJsonError("invalid JSON");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [petJsonFile]);

  // Build a blob URL for the sprite preview, revoke when replaced.
  useEffect(() => {
    if (!spriteFile) {
      setSpriteUrl(null);
      return;
    }
    const url = URL.createObjectURL(spriteFile);
    setSpriteUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [spriteFile]);

  const ready =
    parsedPetJson && spriteFile && perk && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    if (!petJsonFile || !spriteFile || !perk || !parsedPetJson) return;

    setSubmitting(true);
    const fd = new FormData();
    fd.set("pet_json", petJsonFile, "pet.json");
    fd.set("spritesheet", spriteFile, "spritesheet.webp");
    fd.set("nft_mint", perk.mint);
    fd.set("nft_name", perk.name);
    fd.set("nft_image_url", perk.imageUrl);
    try {
      const res = await fetch("/api/admin/upload-pet", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { ok?: boolean; slug?: string; error?: string };
      if (!res.ok || !data.ok || !data.slug) {
        toast.error("Upload failed", { description: data.error });
        return;
      }
      toast.success("Pet uploaded", {
        description: `Linked to ${perk.name}`,
      });
      router.push(`/pets/${data.slug}`);
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  const expDate = useMemo(
    () => new Date(expSeconds * 1000),
    [expSeconds],
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SessionBar wallet={wallet} expDate={expDate} />

      <Section title="1. Files">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FilePicker
            label="pet.json"
            accept="application/json,.json"
            file={petJsonFile}
            onChange={setPetJsonFile}
            error={petJsonError}
          />
          <FilePicker
            label="spritesheet.webp"
            accept="image/webp,.webp"
            file={spriteFile}
            onChange={setSpriteFile}
          />
        </div>
      </Section>

      <Section title="2. Link to NFT">
        <PerkPicker selected={perk} onSelect={setPerk} />
      </Section>

      <Section title="3. Preview & confirm">
        {parsedPetJson && spriteUrl ? (
          <PreviewCard
            petJson={parsedPetJson}
            spriteUrl={spriteUrl}
            perk={perk}
          />
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
            Pick a <code>pet.json</code> and <code>spritesheet.webp</code> to
            see the live preview.
          </div>
        )}
      </Section>

      <div className="flex items-center justify-end gap-3">
        {parsedPetJson && (
          <span className="text-xs text-muted-foreground">
            Will overwrite if a Pet with id{" "}
            <code className="text-foreground">{parsedPetJson.id}</code>{" "}
            already exists.
          </span>
        )}
        <Button type="submit" size="lg" disabled={!ready}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {submitting ? "Uploading…" : "Upload Pet"}
        </Button>
      </div>
    </form>
  );
}

function SessionBar({
  wallet,
  expDate,
}: {
  wallet: string;
  expDate: Date;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-primary/5 px-4 py-2 text-xs">
      <span className="inline-flex items-center gap-2">
        <ShieldCheck className="size-3.5 text-primary" /> Admin session active
      </span>
      <span className="font-mono text-muted-foreground">
        {short(wallet)} · expires{" "}
        {expDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function FilePicker({
  label,
  accept,
  file,
  onChange,
  error,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string | null;
}) {
  const id = `file-${label}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="cursor-pointer file:mr-3 file:h-7 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:text-xs"
      />
      {file && !error && (
        <div className="flex items-center gap-1.5 text-xs text-primary">
          <CheckCircle2 className="size-3.5" />
          <span className="truncate">
            {file.name} · {formatBytes(file.size)}
          </span>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function PerkPicker({
  selected,
  onSelect,
}: {
  selected: SelectedPerk | null;
  onSelect: (p: SelectedPerk) => void;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SelectedPerk[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      setLoading(true);
      searchPerks(query)
        .then((res) => setMatches(res))
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by perk number, e.g. 865"
          className="pl-9"
        />
        {open && query.trim() && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
            {loading && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Searching…
              </div>
            )}
            {!loading && matches.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No matches.
              </div>
            )}
            {matches.map((m) => (
              <button
                key={m.mint}
                type="button"
                onClick={() => {
                  onSelect(m);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt={m.name}
                  className="size-8 rounded-md bg-secondary object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {m.mint.slice(0, 6)}…{m.mint.slice(-6)}
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.imageUrl}
            alt={selected.name}
            className="size-12 rounded-md bg-secondary object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{selected.name}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {selected.mint}
            </div>
          </div>
          <span className="text-xs text-primary">selected</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pick the NFT this Pet should be linked to.
        </p>
      )}
    </div>
  );
}

function PreviewCard({
  petJson,
  spriteUrl,
  perk,
}: {
  petJson: ParsedPetJson;
  spriteUrl: string;
  perk: SelectedPerk | null;
}) {
  const [stateRow, setStateRow] = useState<string>("idle");
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_1fr]">
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-secondary p-3">
        <SpritePlayer src={spriteUrl} state={stateRow} size={180} fps={10} />
        <div className="flex flex-wrap justify-center gap-1">
          {ROW_SPECS.map((r) => (
            <button
              key={r.state}
              type="button"
              onClick={() => setStateRow(r.state)}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                stateRow === r.state
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.state}
            </button>
          ))}
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <PreviewRow label="id" value={petJson.id} mono />
        <PreviewRow label="displayName" value={petJson.displayName} />
        <PreviewRow
          label="description"
          value={petJson.description || "(none)"}
        />
        <PreviewRow
          label="NFT"
          value={perk ? perk.name : "— pick one above —"}
        />
        <PreviewRow
          label="mint"
          value={perk ? perk.mint : "—"}
          mono
        />
      </dl>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : ""}>{value}</dd>
    </div>
  );
}
