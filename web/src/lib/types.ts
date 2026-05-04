export type AnimationRow = {
  state: string;
  frames: number;
};

export const ATLAS_SPEC = {
  width: 1536,
  height: 1872,
  cols: 8,
  rows: 9,
  cellWidth: 192,
  cellHeight: 208,
} as const;

export const ROW_SPECS: AnimationRow[] = [
  { state: "idle", frames: 6 },
  { state: "running-right", frames: 8 },
  { state: "running-left", frames: 8 },
  { state: "waving", frames: 4 },
  { state: "jumping", frames: 5 },
  { state: "failed", frames: 8 },
  { state: "waiting", frames: 6 },
  { state: "running", frames: 6 },
  { state: "review", frames: 6 },
];

export type PetStatus = "ready" | "in_progress" | "requested";

export type Pet = {
  id: string;
  displayName: string;
  description: string;
  nftMint: string;
  nftName: string;
  nftImageUrl: string;
  spritesheetUrl: string | null;
  status: PetStatus;
  createdAt: string;
};

export type OwnedNft = {
  mint: string;
  name: string;
  imageUrl: string;
  collection?: string;
};

export type PetRequest = {
  nftMint: string;
  nftName: string;
  notes: string;
  email?: string;
};
