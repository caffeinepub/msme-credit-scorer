# MSME Credit Scorer

## Current State

A full-stack MSME credit scoring app for Gujarat businesses, running on Motoko + React. The app includes:

- Role-based auth (borrower / admin) with localStorage-backed session
- Business profile management (name, GST, industry, revenue, expenses, age, location)
- Alternative credit scoring (300–900 scale) based on revenue, business age, expense ratio, and industry risk
- Risk tier classification (Low / Medium / High)
- Stability score (0–100)
- EMI risk predictor with advice banners
- Cashflow 3-month analysis page
- Document upload + list
- Credit Score Simulator with sliders and score improvement tips
- Admin dashboard with fraud alerts and user management
- Gujarati / Hindi language toggle

The `CreditScore` type currently stores: `altScore`, `riskTier`, `stabilityScore`, `fraudFlag`.  
The dashboard shows only the alternative score. There is no traditional (CIBIL) score input or display.  
There is no EMI calculator tool — only the EMI risk predictor on the cashflow page.

## Requested Changes (Diff)

### Add

1. **Traditional Score input and display**
   - Allow borrowers to manually enter their CIBIL/traditional credit score (300–900 range)
   - Store `traditionalScore` in the `CreditScore` type (optional, can be null if not entered)
   - Show a side-by-side comparison card on the Dashboard: Traditional Score vs. Alternative Score
   - Add a visual indicator showing which score is higher and what that means for loan eligibility
   - Include a "Why two scores?" explanation tooltip/section

2. **EMI Calculator page** (`/emi-calculator`)
   - Dedicated page (new route) with a full EMI calculator tool
   - Inputs: Loan Amount (₹), Interest Rate (% p.a.), Tenure (months)
   - Output: Monthly EMI (₹), Total Interest Payable (₹), Total Amount Payable (₹)
   - Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1) where r = monthly interest rate
   - Amortization breakdown table showing first 12 months (month, principal, interest, balance)
   - EMI-to-income ratio indicator based on the user's monthly revenue from their profile
   - Visual affordability indicator: Green (EMI < 30% of revenue), Yellow (30-50%), Red (>50%)
   - Add EMI Calculator link to dashboard quick actions and sidebar nav

3. **i18n keys** for all new UI strings (en / gu / hi)

### Modify

1. **`CreditScore` type** — add optional `traditionalScore: number | null` field
2. **`store.ts`** — update `saveProfile()` and seed data to retain `traditionalScore` (default null)
3. **Dashboard** — extend score cards section to show both scores side-by-side when traditional score exists; add prompt to enter traditional score if missing
4. **Simulator page** — add traditional score input field so users can see how their alt score compares
5. **Nav / Sidebar** — add EMI Calculator link

### Remove

Nothing removed.

## Implementation Plan

1. Update `types.ts`: add `traditionalScore: number | null` to `CreditScore` interface
2. Update `scoring.ts`: add `getTraditionalScoreLabel()` helper (Excellent/Good/Fair/Poor based on CIBIL ranges)
3. Update `store.ts`: update `saveProfile()` to preserve existing `traditionalScore`; update seed scores to include `traditionalScore: null`; add `saveTraditionalScore(userId, score)` function
4. Update `i18n.ts`: add translation keys for all new strings in en/gu/hi
5. Update `DashboardPage.tsx`: add side-by-side score comparison cards (alt + traditional), add "enter traditional score" prompt CTA with inline input
6. Create `EMICalculatorPage.tsx`: full EMI calculator with inputs, formula output, amortization table, affordability indicator
7. Update `App.tsx`: add `/emi-calculator` route
8. Update `PageLayout`/nav component: add EMI Calculator nav link
9. Update `SimulatorPage.tsx`: add optional traditional score input for comparison
