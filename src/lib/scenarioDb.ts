/**
 * Scenarios (What-If) data layer.
 * Implemented in backendClient.ts (in-memory by default).
 * To use your backend: replace the implementation in src/lib/backendClient.ts
 * with your API calls. See docs/BACKEND_API.md.
 */

export {
  loadScenariosForModel,
  loadBasecaseResults,
  ensureBasecaseScenario,
  scenarioDb,
} from './backendClient';
