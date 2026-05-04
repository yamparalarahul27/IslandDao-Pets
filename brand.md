# IslandDAO Pets — Brand

Palette and tone pulled directly from
[islanddao.org](https://islanddao.org). The Pets app is a sub-experience
under the IslandDAO brand, so it inherits the look: deep teal night sky,
mint accent, white text. Dark by default.

## Voice

- Warm, direct, slightly playful — but the chrome stays serious.
- Talk about Pets like little companions, not "assets".
- Say "claim your Pet" and "find your Pet" rather than "mint" or "fetch".
- Keep copy short. Small label > long sentence.

## Palette

Source: extracted from `islanddao.org`'s production stylesheet.

| Hex        | Name                | Use                                       |
|------------|---------------------|-------------------------------------------|
| `#041616`  | Abyss teal          | Page background (darkest)                 |
| `#0a3131`  | Deep teal           | Cards / primary surface                   |
| `#0d4a4a`  | Mid teal            | Muted / secondary surface                 |
| `#1a5a5a`  | Lifted teal         | Subtle accent surfaces                    |
| `#3d5a5a`  | Slate teal          | Muted text in light mode                  |
| `#bcebc4`  | Mint                | **Primary accent** — CTAs, highlights     |
| `#e2ffe7`  | Pale mint           | Foreground text on dark, glow tint        |
| `#b8d4c8`  | Mist                | Muted foreground on dark                  |
| `#ffb4ab`  | Warm coral          | Destructive / error                       |
| `#ba1a1a`  | Deep red            | Destructive on light                      |

## Typography

- **Headings**: Space Grotesk (`var(--font-space-grotesk)`), 500–700.
  IslandDAO uses *PP Monument Extended* (paid) + *Deutschlander*; Space
  Grotesk is the closest free Google Font with similar wide modern feel.
  Default tracking: `-0.02em`.
- **Body**: Geist (`var(--font-sans)`), regular.
- **Mono**: Geist Mono — for mint addresses, atlas dimensions, small chips.

## Mode

Dark is the canonical mode. The app sets `<html className="dark">` by
default. Light mode exists as a clean inversion in `globals.css` for
when we add a theme toggle.

## Surfaces & motion

- Page bg has two soft radial glows: mint at top-right, deep teal at
  bottom-left. Subtle, not loud.
- Cards: `bg-card` (`#0a3131`) with thin `border-border`
  (`rgba(255,255,255,0.08)`).
- Pets idle-loop on cards at ~10 fps.
- Hover on a Pet card: gentle lift (`-translate-y-0.5`).
- Toast on connect / claim — never a modal for routine confirmations.

## Imagery

- Primary visual is the Pet sprite playing live.
- Avoid stock illustration. The sprites *are* the brand.
