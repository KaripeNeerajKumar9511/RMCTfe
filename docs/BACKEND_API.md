# Backend API Contract

This app no longer uses Supabase. You can implement your own backend and wire it here. The frontend expects the operations below. Implement these as REST (or your preferred) endpoints and call them from `src/lib/backendClient.ts`.

---

## 1. Models

| Operation | Purpose | Suggested endpoint | Request | Response |
|-----------|---------|--------------------|---------|----------|
| **List models** | Get all models with full nested data (general, labor, equipment, products, operations, routing, ibom, param_names) | `GET /api/models` | - | `Model[]` |
| **Get one model** | Get single model by id | `GET /api/models/:id` | - | `Model \| null` |
| **Create/update full model** | Save entire model (create or replace) | `POST /api/models` or `PUT /api/models/:id` | `Model` | - |
| **Update model metadata** | Partial update (name, description, tags, run_status, updated_at, etc.) | `PATCH /api/models/:id` | `Partial<Model>` | - |
| **Delete model** | Delete model and all related data | `DELETE /api/models/:id` | - | - |

### Model-scoped CRUD (optional: can be part of PATCH or separate)

- **General:** `PATCH /api/models/:id/general` — `Partial<GeneralData>`
- **Param names:** `PUT /api/models/:id/param-names` — `ParamNames`
- **Labor:** `POST /api/models/:id/labor`, `PATCH /api/models/:id/labor/:laborId`, `DELETE /api/models/:id/labor/:laborId`
- **Equipment:** `POST /api/models/:id/equipment`, `PATCH /api/models/:id/equipment/:equipId`, `DELETE /api/models/:id/equipment/:equipId`
- **Products:** `POST /api/models/:id/products`, `PATCH /api/models/:id/products/:productId`, `DELETE /api/models/:id/products/:productId`
- **Operations:** `POST /api/models/:id/operations`, `PATCH /api/models/:id/operations/:opId`, `DELETE /api/models/:id/operations/:opId`
- **Routing:** `POST /api/models/:id/routing`, `PATCH /api/models/:id/routing/:routeId`, `DELETE /api/models/:id/routing/:routeId`, or bulk `PUT /api/models/:id/routing` (product scoped)
- **IBOM:** `POST /api/models/:id/ibom`, `PATCH /api/models/:id/ibom/:entryId`, `DELETE /api/models/:id/ibom/:entryId`, or `PUT /api/models/:id/ibom/:parentProductId`
- **Clear product ops & routing:** `DELETE /api/models/:id/products/:productId/operations-and-routing` (or equivalent)

Types for `Model`, `GeneralData`, `ParamNames`, `LaborGroup`, `EquipmentGroup`, `Product`, `Operation`, `RoutingEntry`, `IBOMEntry` are in `@/stores/modelStore`.

---

## 2. Versions (checkpoints)

| Operation | Purpose | Suggested endpoint | Request | Response |
|-----------|---------|--------------------|---------|----------|
| **List versions** | List checkpoints for a model | `GET /api/models/:modelId/versions` | - | `{ id, label, created_at }[]` |
| **Create version** | Save checkpoint snapshot | `POST /api/models/:modelId/versions` | `{ label, snapshot }` | `{ id }` |
| **Get version snapshot** | Get snapshot + created_at for restore | `GET /api/versions/:versionId` or `GET /api/models/:modelId/versions/:versionId` | - | `{ snapshot, created_at }` |
| **Rename version** | Update checkpoint label | `PATCH /api/versions/:versionId` | `{ label }` | - |
| **Delete version** | Delete checkpoint | `DELETE /api/versions/:versionId` | - | - |
| **Restore version** | Apply snapshot to model (server can replace model data) | `POST /api/models/:modelId/versions/:versionId/restore` | - | `Model` (optional) |

`snapshot` shape: `{ general, labor, equipment, products, operations, routing, ibom, param_names }` (same types as in `modelStore`).

---

## 3. Scenarios (What-If)

| Operation | Purpose | Suggested endpoint | Request | Response |
|-----------|---------|--------------------|---------|----------|
| **Load scenarios for model** | Scenarios + changes + cached results | `GET /api/models/:modelId/scenarios` | - | `{ scenarios: Scenario[], results: Record<scenarioId, CalcResults> }` |
| **Load basecase results** | Cached basecase calculation result | `GET /api/models/:modelId/scenarios/basecase/results` | - | `CalcResults \| null` |
| **Ensure basecase** | Ensure basecase scenario row exists; return id | `POST /api/models/:modelId/scenarios/basecase` (idempotent) | - | `{ id }` |
| **Create scenario** | New what-if scenario | `POST /api/models/:modelId/scenarios` | `{ name, description }` | `{ id }` |
| **Update scenario** | Name, description, or status | `PATCH /api/scenarios/:id` | `{ name?, description?, status? }` | - |
| **Delete scenario** | Delete scenario and its changes/results | `DELETE /api/scenarios/:id` | - | - |
| **Upsert change** | Create or update one scenario change (what-if override) | `PUT /api/scenarios/:id/changes` | `ScenarioChange` | - |
| **Remove change** | Delete one change | `DELETE /api/scenarios/:scenarioId/changes/:changeId` | - | - |
| **Save results** | Store calculation results for a scenario | `PUT /api/scenarios/:id/results` | `CalcResults` | - |
| **Save basecase results** | Store results for basecase scenario | `PUT /api/models/:modelId/scenarios/basecase/results` | `CalcResults` | - |

Types: `Scenario`, `ScenarioChange` from `@/stores/scenarioStore`; `CalcResults` from `@/lib/calculationEngine`.

---

## Wiring your backend in the app

1. Implement the operations above on your server (REST, GraphQL, etc.).
2. In `src/lib/backendClient.ts`, replace the in-memory implementation with your API calls (e.g. using `fetch` or `axios` from `@/lib/api`).
3. In `src/lib/supabaseData.ts` and `src/lib/scenarioDb.ts`, switch to importing from `backendClient` instead of using the local in-memory store (or use an env flag so you can toggle between in-memory and backend during development).

The rest of the app (stores, pages, components) does not need to change; they keep using `fetchAllModels`, `db`, `scenarioDb`, etc. from `supabaseData` and `scenarioDb`.
