# Mock data for flow analysis

The app runs with **mock data only** (no backend, no Supabase). Data is in-memory and seeded automatically so you can walk through the full flow.

## When mock data is loaded

- **First time** the app requests the model list (e.g. opening Library or a dashboard that calls `loadModels()`), `fetchAllModels()` in `src/lib/backendClient.ts` runs.
- If the in-memory store is empty, it calls `seedMockDataForAnalysis()` once, which:
  1. **Adds the Hub Manufacturing Cell — Demo** (full demo model: labor, equipment, products, operations, routing, IBOM).
  2. **Adds "Simple Analysis Mock"** (minimal model: no labor/equipment/products yet).

So after the first load you always have **2 models** in the Library to use for flow analysis.

## Flow you can follow

1. **Library** (`/library` or dashboard library) — List of models (2 mock cards).
2. **Open a model** — e.g. "Hub Manufacturing Cell — Demo" → Overview / General / Labor / Equipment / Products / Operations / IBOM / Run / What-If / Reports / Settings.
3. **General Data** — Edit model title, units, conversions, util limit, etc.
4. **Labor / Equipment / Products** — CRUD for labor groups, equipment, products.
5. **Operations & Routing** — Define operations per product and routing (DOCK → … → STOCK/SCRAP).
6. **Run & Results** — Run calculation, see basecase results.
7. **What-If Studio** — Create scenarios, change values, compare results.
8. **Checkpoints** — Save/restore version snapshots (stored in memory).
9. **Model Settings** — Rename, tags, param names, delete model.

All of this uses the same in-memory state in `backendClient.ts` (models, versions, scenarios, results). Reloading the page clears it and re-seeds the same 2 mock models.

## Where it’s implemented

- **Seeding:** `src/lib/backendClient.ts` → `seedMockDataForAnalysis()`, `seedDemoModelToDB()`.
- **Demo model shape:** `src/stores/modelStore.ts` → `createDemoModel()`.

To **switch to a real backend**, replace the implementation in `backendClient.ts` with your API calls and remove or gate the `seedMockDataForAnalysis()` call (e.g. only run when `process.env.NEXT_PUBLIC_USE_MOCK === 'true'`).
