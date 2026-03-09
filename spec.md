# CredVist

## Current State
- `traditionalScore` in `CreditScore` is `number | null`, defaults to null
- Users manually enter a CIBIL score on the dashboard via an input + Save button
- `saveTraditionalScore(userId, score)` persists the manual value in localStorage
- `saveProfile()` preserves the existing manually-entered `traditionalScore` when recalculating
- Label reads "CIBIL Score (300–900)"

## Requested Changes (Diff)

### Add
- `calculateTraditionalScore(data)` in `scoring.ts` — computes 300–900 from revenue, expense ratio, business age, cashflow consistency (optional), and risk indicators

### Modify
- `store.ts` `saveProfile()`: auto-calculate traditionalScore using `calculateTraditionalScore`; pass cashflow if available
- Remove `saveTraditionalScore()` usage
- `DashboardPage.tsx`: Replace manual input card with read-only display labeled "Traditional Credit Score (System Estimated)"
- Update improvement roadmap copy in `scoring.ts`

### Remove
- Manual CIBIL input field, Save button, "Update CIBIL score" ghost button
- `saveTraditionalScore` function call from DashboardPage

## Implementation Plan
1. Add `calculateTraditionalScore` to `scoring.ts`
2. Update `saveProfile` in `store.ts`
3. Update `DashboardPage.tsx` UI
4. Update improvement roadmap step copy
