# CredVist — Premium Animated Background Theme

## Current State
CredVist is a full-featured fintech platform with a React + TypeScript frontend. The app has a light grey (#F5F6FA) base background with static card layouts across all pages (dashboard, loan eligibility, bank recommendation, pre-approval engine, UPI scoring, fraud detection, etc.).

## Requested Changes (Diff)

### Add
- `AnimatedBackground` component: full-screen fixed canvas layer rendering:
  - Slow-moving particle system (tiny floating circles, ~40–60 particles)
  - Animated soft gradient orbs shifting between #1A73E8 (blue), #34A853 (green), #FABB05 (gold) at 10–15% opacity
  - Subtle diagonal animated lines/curves at very low opacity (~5–8%)
- `useMouseParallax` hook: captures mouse/scroll position and applies slight parallax offset to background orbs
- Card hover glow effect via CSS: `.fintech-card:hover` triggers a radial gradient glow behind the card using the brand blue/green palette
- Global CSS animation keyframes for: gradient-shift, float-particle, wave-move
- Background layering: z-index 0 for animated canvas, z-index 1+ for all content

### Modify
- `index.css` / global styles: set `background: #F5F6FA` as base, inject keyframe animations, add `.fintech-card` hover glow styles
- App root wrapper: add `<AnimatedBackground />` as first child, fixed/absolute positioned behind all content
- All page containers: ensure `position: relative; z-index: 1` so they sit above the animation layer

### Remove
- Nothing — zero existing features, pages, or functionality changed

## Implementation Plan
1. Create `AnimatedBackground.tsx` — Canvas-based particle + orb animation, requestAnimationFrame loop, 60fps optimized, mobile-aware (reduced particles on small screens)
2. Create animation CSS in `index.css` — keyframes for gradient-shift, float, wave; card hover glow utility class
3. Wire `<AnimatedBackground />` into `App.tsx` or root layout as fixed background layer
4. Apply `z-index` layering to ensure all existing content renders above the background
5. Add subtle card hover glow via CSS on existing card elements
