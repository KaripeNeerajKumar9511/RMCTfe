/**
 * Backend data layer — all CRUD and data access via Django backend API.
 * When USE_FRONTEND_ONLY is true, no API calls are made; dashboard uses in-memory state only.
 * See docs/BACKEND_API.md.
 */

import api from '@/lib/api';
import { USE_FRONTEND_ONLY } from '@/lib/frontendOnly';
import type { Model, LaborGroup, EquipmentGroup, Product, Operation, RoutingEntry, IBOMEntry, GeneralData, ParamNames } from '@/stores/modelStore';
import { defaultParamNames } from '@/stores/modelStore';
import type { Scenario, ScenarioChange } from '@/stores/scenarioStore';
import type { CalcResults } from '@/lib/calculationEngine';

const BASE = '/api';

export interface VersionSnapshot {
  general: GeneralData;
  labor: LaborGroup[];
  equipment: EquipmentGroup[];
  products: Product[];
  operations: Operation[];
  routing: RoutingEntry[];
  ibom: IBOMEntry[];
  param_names: ParamNames | null;
}

// ─── Models ─────────────────────────────────────────────────────────────

export async function fetchAllModels(): Promise<Model[]> {
  if (USE_FRONTEND_ONLY) return [];
  const { data } = await api.get<Model[]>(`${BASE}/models/`);
  return Array.isArray(data) ? data : [];
}

export async function getModel(id: string): Promise<Model | null> {
  if (USE_FRONTEND_ONLY) return null;
  const { data } = await api.get<Model | null>(`${BASE}/models/${id}/`);
  return data ?? null;
}

export async function saveFullModelToDB(model: Model): Promise<void> {
  if (USE_FRONTEND_ONLY) return;
  const existing = await getModel(model.id);
  if (existing) {
    await api.put(`${BASE}/models/${model.id}/save/`, model);
  } else {
    await api.post(`${BASE}/models/`, model);
  }
}

export async function seedDemoModelToDB(): Promise<void> {
  if (USE_FRONTEND_ONLY) return;
  const { createDemoModel } = await import('@/stores/modelStore');
  const demo = createDemoModel();
  await api.post(`${BASE}/models/seed-demo/`, demo);
}

export function getParamNames(modelId: string): ParamNames | null {
  return null;
}

export async function getParamNamesAsync(modelId: string): Promise<ParamNames | null> {
  if (USE_FRONTEND_ONLY) return null;
  const { data } = await api.get<ParamNames | null>(`${BASE}/models/${modelId}/param-names/`);
  return data ?? null;
}

// ─── Versions ───────────────────────────────────────────────────────────

export async function getVersions(modelId: string): Promise<{ id: string; label: string; created_at: string }[]> {
  if (USE_FRONTEND_ONLY) return [];
  const { data } = await api.get<{ id: string; label: string; created_at: string }[]>(`${BASE}/models/${modelId}/versions/`);
  return Array.isArray(data) ? data : [];
}

export async function createVersion(modelId: string, label: string, snapshot: VersionSnapshot): Promise<string> {
  if (USE_FRONTEND_ONLY) return crypto.randomUUID();
  const { data } = await api.post<{ id: string }>(`${BASE}/models/${modelId}/versions/create/`, { label, snapshot });
  return data.id;
}

export async function getVersionSnapshot(versionId: string): Promise<{ snapshot: VersionSnapshot; created_at: string } | null> {
  if (USE_FRONTEND_ONLY) return null;
  const { data } = await api.get<{ snapshot: VersionSnapshot; created_at: string } | null>(`${BASE}/versions/${versionId}/`);
  return data ?? null;
}

export async function updateVersionLabel(versionId: string, label: string): Promise<void> {
  if (USE_FRONTEND_ONLY) return;
  await api.patch(`${BASE}/versions/${versionId}/patch/`, { label });
}

export async function deleteVersion(versionId: string): Promise<void> {
  if (USE_FRONTEND_ONLY) return;
  await api.delete(`${BASE}/versions/${versionId}/delete/`);
}

export async function restoreVersionToModel(versionId: string, modelId: string): Promise<Model | null> {
  if (USE_FRONTEND_ONLY) return null;
  const { data } = await api.post<Model>(`${BASE}/models/${modelId}/versions/${versionId}/restore/`);
  return data ?? null;
}

// ─── db (model CRUD) ────────────────────────────────────────────────────

export const db = {
  async updateModel(id: string, data: Record<string, unknown>) {
    if (USE_FRONTEND_ONLY) return;
    await api.patch(`${BASE}/models/${id}/patch/`, data);
  },

  async deleteModel(id: string) {
    if (USE_FRONTEND_ONLY) return;
    await api.delete(`${BASE}/models/${id}/delete/`);
  },

  async upsertParamNames(modelId: string, data: Partial<ParamNames>) {
    if (USE_FRONTEND_ONLY) return;
    await api.put(`${BASE}/models/${modelId}/param-names/upsert/`, data);
  },

  async updateGeneral(modelId: string, data: Partial<GeneralData>) {
    if (USE_FRONTEND_ONLY) return;
    await api.patch(`${BASE}/models/${modelId}/general/`, data);
  },

  async insertLabor(modelId: string, l: LaborGroup) {
    if (USE_FRONTEND_ONLY) return;
    await api.post(`${BASE}/models/${modelId}/labor/`, l);
  },
  async updateLabor(id: string, data: Partial<LaborGroup>) {
    if (USE_FRONTEND_ONLY) return;
    // Backend needs modelId; we don't have it from labor id. Caller must pass modelId in store. Use PATCH with labor id.
    // Backend URL is PATCH /api/models/:modelId/labor/:laborId/ - we need modelId. So db.updateLabor is called with just id.
    // In modelStore, updateLabor is called with (modelId, laborId, data). So we need modelId in db object. Check usage.
    // backendClient db is used from modelStore which has modelId in scope. So we need to change db to accept modelId for updateLabor.
    // Looking at BACKEND_API: PATCH /api/models/:id/labor/:laborId. So we need modelId. The current signature is updateLabor(id, data) where id is labor id.
    // So the store must pass modelId. Let me check modelStore updateLabor usage.
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.patch(`${BASE}/models/${modelId}/labor/${id}/`, data);
  },
  async deleteLabor(id: string) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.delete(`${BASE}/models/${modelId}/labor/${id}/delete/`);
  },

  async insertEquipment(modelId: string, e: EquipmentGroup) {
    if (USE_FRONTEND_ONLY) return;
    await api.post(`${BASE}/models/${modelId}/equipment/`, e);
  },
  async updateEquipment(id: string, data: Partial<EquipmentGroup>) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.patch(`${BASE}/models/${modelId}/equipment/${id}/`, data);
  },
  async deleteEquipment(id: string) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.delete(`${BASE}/models/${modelId}/equipment/${id}/delete/`);
  },

  async insertProduct(modelId: string, p: Product) {
    if (USE_FRONTEND_ONLY) return;
    await api.post(`${BASE}/models/${modelId}/products/`, p);
  },
  async updateProduct(id: string, data: Partial<Product>) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.patch(`${BASE}/models/${modelId}/products/${id}/`, data);
  },
  async deleteProduct(modelId: string, productId: string) {
    if (USE_FRONTEND_ONLY) return;
    await api.delete(`${BASE}/models/${modelId}/products/${productId}/delete/`);
  },

  async insertOperation(modelId: string, o: Operation) {
    if (USE_FRONTEND_ONLY) return;
    await api.post(`${BASE}/models/${modelId}/operations/`, o);
  },
  async updateOperation(id: string, data: Partial<Operation>) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.patch(`${BASE}/models/${modelId}/operations/${id}/`, data);
  },
  async deleteOperation(modelId: string, opId: string, _opName: string, productId: string) {
    if (USE_FRONTEND_ONLY) return;
    await api.delete(`${BASE}/models/${modelId}/operations/${opId}/delete/`);
  },

  async insertRouting(modelId: string, r: RoutingEntry, _operations: Operation[]) {
    if (USE_FRONTEND_ONLY) return;
    await api.post(`${BASE}/models/${modelId}/routing/`, r);
  },
  async updateRouting(id: string, data: Partial<RoutingEntry>) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.patch(`${BASE}/models/${modelId}/routing/${id}/`, data);
  },
  async deleteRouting(id: string) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.delete(`${BASE}/models/${modelId}/routing/${id}/delete/`);
  },
  async setRouting(modelId: string, productId: string, entries: RoutingEntry[], _operations: Operation[]) {
    if (USE_FRONTEND_ONLY) return;
    await api.put(`${BASE}/models/${modelId}/routing/set/`, { productId, entries });
  },

  async insertIBOM(modelId: string, entry: IBOMEntry) {
    if (USE_FRONTEND_ONLY) return;
    await api.post(`${BASE}/models/${modelId}/ibom/`, entry);
  },
  async updateIBOM(id: string, data: Partial<IBOMEntry>) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.patch(`${BASE}/models/${modelId}/ibom/entry/${id}/`, data);
  },
  async deleteIBOM(id: string) {
    if (USE_FRONTEND_ONLY) return;
    const { useModelStore } = await import('@/stores/modelStore');
    const modelId = useModelStore.getState().activeModelId;
    if (modelId) await api.delete(`${BASE}/models/${modelId}/ibom/entry/${id}/delete/`);
  },
  async setIBOMForParent(modelId: string, parentId: string, entries: IBOMEntry[]) {
    if (USE_FRONTEND_ONLY) return;
    await api.put(`${BASE}/models/${modelId}/ibom/${parentId}/`, entries);
  },

  async clearProductOperationsAndRouting(modelId: string, productId: string) {
    if (USE_FRONTEND_ONLY) return;
    await api.delete(`${BASE}/models/${modelId}/products/${productId}/operations-and-routing/`);
  },
};

// ─── Scenarios ──────────────────────────────────────────────────────────

export async function loadScenariosForModel(modelId: string): Promise<{
  scenarios: Scenario[];
  results: Record<string, CalcResults>;
}> {
  if (USE_FRONTEND_ONLY) return { scenarios: [], results: {} };
  const { data } = await api.get<{ scenarios: Scenario[]; results: Record<string, CalcResults> }>(`${BASE}/models/${modelId}/scenarios/`);
  return {
    scenarios: data?.scenarios ?? [],
    results: data?.results ?? {},
  };
}

export async function loadBasecaseResults(modelId: string): Promise<CalcResults | null> {
  if (USE_FRONTEND_ONLY) return null;
  const { data } = await api.get<CalcResults | null>(`${BASE}/models/${modelId}/scenarios/basecase/results/`);
  return data ?? null;
}

export async function ensureBasecaseScenario(modelId: string): Promise<string> {
  if (USE_FRONTEND_ONLY) return crypto.randomUUID();
  const { data } = await api.post<{ id: string }>(`${BASE}/models/${modelId}/scenarios/basecase/`);
  return data.id;
}

export const scenarioDb = {
  async create(modelId: string, name: string, description: string): Promise<string | null> {
    if (USE_FRONTEND_ONLY) return crypto.randomUUID();
    const { data } = await api.post<{ id: string }>(`${BASE}/models/${modelId}/scenarios/`, { name, description });
    return data?.id ?? null;
  },

  async update(id: string, data: { name?: string; description?: string; status?: string }) {
    if (USE_FRONTEND_ONLY) return;
    await api.patch(`${BASE}/scenarios/${id}/`, data);
  },

  async delete(id: string) {
    if (USE_FRONTEND_ONLY) return;
    await api.delete(`${BASE}/scenarios/${id}/delete/`);
  },

  async upsertChange(scenarioId: string, change: ScenarioChange) {
    if (USE_FRONTEND_ONLY) return;
    await api.put(`${BASE}/scenarios/${scenarioId}/changes/`, {
      id: change.id,
      dataType: change.dataType,
      entityId: change.entityId,
      entityName: change.entityName,
      field: change.field,
      fieldLabel: change.fieldLabel,
      basecaseValue: change.basecaseValue,
      whatIfValue: change.whatIfValue,
    });
  },

  async removeChange(scenarioId: string, changeId: string) {
    if (USE_FRONTEND_ONLY) return;
    await api.delete(`${BASE}/scenarios/${scenarioId}/changes/${changeId}/delete/`);
  },

  async saveResults(scenarioId: string, results: CalcResults) {
    if (USE_FRONTEND_ONLY) return;
    await api.put(`${BASE}/scenarios/${scenarioId}/results/`, results);
  },

  async saveBasecaseResults(modelId: string, results: CalcResults) {
    if (USE_FRONTEND_ONLY) return;
    await api.put(`${BASE}/models/${modelId}/scenarios/basecase/results/`, results);
  },
};
