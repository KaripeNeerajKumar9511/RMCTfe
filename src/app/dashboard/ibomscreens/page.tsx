"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModelStore, type IBOMEntry } from '@/stores/modelStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, ChevronDown, Network, X, Search, Package, PlusCircle, GitBranch, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TreeNode {
  productId: string;
  productName: string;
  unitsPerAssy: number;
  children: TreeNode[];
  depth: number;
}

// Draft component entry for local editing
interface DraftComponent {
  id: string;
  component_product_id: string;
  units_per_assy: number;
  isNew?: boolean; // newly added, not yet saved
}

export default function IBOMScreen() {
  const router = useRouter();
  const model = useModelStore((s) => s.getActiveModel());
  const modelId = model?.id ?? '';
  const addIBOM = useModelStore((s) => s.addIBOM);
  const updateIBOM = useModelStore((s) => s.updateIBOM);
  const deleteIBOM = useModelStore((s) => s.deleteIBOM);
  const setIBOMForParent = useModelStore((s) => s.setIBOMForParent);
  const activeScenarioId = useScenarioStore(s => s.activeScenarioId);
  const activeScenario = useScenarioStore(s => s.scenarios.find(sc => sc.id === s.activeScenarioId));

  const [viewAssemblyId, setViewAssemblyId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [checkedAllowable, setCheckedAllowable] = useState<Set<string>>(new Set());
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const [showRemoveAllDialog, setShowRemoveAllDialog] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [upaErrors, setUpaErrors] = useState<Set<string>>(new Set());
  const [showEmptyPicker, setShowEmptyPicker] = useState(false);

  // ═══ DRAFT STATE ═══
  // draftComponents: local working copy of components for the selected product
  // savedSnapshot: the components as they were when last saved/loaded
  const [draftComponents, setDraftComponents] = useState<DraftComponent[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<DraftComponent[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Pending switch target when dirty
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (draftComponents.length !== savedSnapshot.length) return true;
    for (let i = 0; i < draftComponents.length; i++) {
      const d = draftComponents[i];
      const s = savedSnapshot.find(x => x.id === d.id);
      if (!s) return true; // new component
      if (d.units_per_assy !== s.units_per_assy) return true;
      if (d.component_product_id !== s.component_product_id) return true;
    }
    // Check if any saved items were removed
    for (const s of savedSnapshot) {
      if (!draftComponents.find(d => d.id === s.id)) return true;
    }
    return false;
  }, [draftComponents, savedSnapshot]);

  // Track which UPA values changed from saved state
  const changedUpaIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of draftComponents) {
      const s = savedSnapshot.find(x => x.id === d.id);
      if (s && d.units_per_assy !== s.units_per_assy) {
        ids.add(d.id);
      }
    }
    return ids;
  }, [draftComponents, savedSnapshot]);

  // Read product param from URL and pre-select on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || !model) return;
    const params = new URLSearchParams(window.location.search);
    const productParam = params.get('product');
    if (productParam) {
      const match = model.products.find(p => p.id === productParam || p.name === productParam);
      if (match) {
        setViewAssemblyId(match.id);
        setSelectedProductId(match.id);
        initializedRef.current = true;
      }
    }
  }, [model]);

  // Sync draft when selectedProductId changes (load from model)
  const editParentId = selectedProductId || '';
  useEffect(() => {
    if (!model || !editParentId) {
      setDraftComponents([]);
      setSavedSnapshot([]);
      return;
    }
    const entries = model.ibom
      .filter((e) => e.parent_product_id === editParentId)
      .map(e => ({ id: e.id, component_product_id: e.component_product_id, units_per_assy: e.units_per_assy }));
    setDraftComponents(entries);
    setSavedSnapshot(entries);
    setCheckedAllowable(new Set());
    setConfirmingRemoveId(null);
    setShowEmptyPicker(false);
    setUpaErrors(new Set());
  }, [editParentId, model?.id]); // Only reset when product selection changes, not on every model update

  // Track previous valid values for revert on blur
  const prevUpaValues = useRef<Map<string, number>>(new Map());

  const buildTree = useCallback((parentId: string, depth: number, visited: Set<string>): TreeNode[] => {
    if (!model || visited.has(parentId)) return [];
    const entries = model.ibom.filter((e) => e.parent_product_id === parentId);
    return entries.map((e) => {
      const product = model.products.find((p) => p.id === e.component_product_id);
      const nextVisited = new Set(visited);
      nextVisited.add(parentId);
      return {
        productId: e.component_product_id,
        productName: product?.name || '???',
        unitsPerAssy: e.units_per_assy,
        children: buildTree(e.component_product_id, depth + 1, nextVisited),
        depth,
      };
    });
  }, [model]);

  const getAncestors = useCallback((productId: string, visited: Set<string> = new Set()): Set<string> => {
    if (!model || visited.has(productId)) return visited;
    visited.add(productId);
    const parents = model.ibom.filter((e) => e.component_product_id === productId);
    parents.forEach((p) => getAncestors(p.parent_product_id, visited));
    return visited;
  }, [model]);

  const tree = useMemo(() => {
    if (!viewAssemblyId) return [];
    return buildTree(viewAssemblyId, 0, new Set());
  }, [viewAssemblyId, buildTree]);

  const maxDepth = useMemo(() => {
    function getDepth(nodes: TreeNode[]): number {
      if (nodes.length === 0) return 0;
      return 1 + Math.max(...nodes.map(n => getDepth(n.children)));
    }
    return getDepth(tree);
  }, [tree]);

  const unitsPerFinalAssy = useMemo(() => {
    if (!model || !viewAssemblyId) return new Map<string, number>();
    const result = new Map<string, number>();
    function traverse(parentId: string, multiplier: number, visited: Set<string>) {
      if (visited.has(parentId)) return;
      const nextVisited = new Set(visited);
      nextVisited.add(parentId);
      const entries = model!.ibom.filter(e => e.parent_product_id === parentId);
      entries.forEach(e => {
        const cumulative = multiplier * e.units_per_assy;
        const existing = result.get(e.component_product_id) || 0;
        result.set(e.component_product_id, existing + cumulative);
        traverse(e.component_product_id, cumulative, nextVisited);
      });
    }
    traverse(viewAssemblyId, 1, new Set());
    return result;
  }, [model, viewAssemblyId]);

  const filterTree = useCallback((nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;
    const lq = query.toLowerCase();
    return nodes.reduce<TreeNode[]>((acc, node) => {
      const filteredChildren = filterTree(node.children, query);
      if (node.productName.toLowerCase().includes(lq) || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  }, []);

  const filteredTree = useMemo(() => filterTree(tree, filterText), [tree, filterText, filterTree]);

  // ═══ DRAFT-AWARE: allowableProducts based on draft, not model ═══
  const allowableProducts = useMemo(() => {
    if (!model || !editParentId) return [];
    const currentCompIds = new Set(draftComponents.map((c) => c.component_product_id));
    const ancestors = getAncestors(editParentId);
    return model.products.filter((p) => {
      if (p.id === editParentId) return false;
      if (currentCompIds.has(p.id)) return false;
      if (ancestors.has(p.id)) return false;
      return true;
    });
  }, [model, editParentId, draftComponents, getAncestors]);

  const isWhatIfTarget = useMemo(() => {
    if (!activeScenario || !editParentId) return false;
    return activeScenario.changes.some(c => c.entityId === editParentId);
  }, [activeScenario, editParentId]);

  // ═══ SAVE / DISCARD ═══
  const handleSave = async () => {
    if (!model || !editParentId) return;
    setIsSaving(true);
    try {
      const newEntries: IBOMEntry[] = draftComponents.map(d => ({
        id: d.id,
        parent_product_id: editParentId,
        component_product_id: d.component_product_id,
        units_per_assy: d.units_per_assy,
      }));
      setIBOMForParent(model.id, editParentId, newEntries);
      const snapshot = draftComponents.map(d => ({ ...d }));
      setSavedSnapshot(snapshot);
      setDraftComponents(snapshot);
      toast.success(`IBOM updated for ${prodName(editParentId)}`);
    } catch {
      toast.error('Failed to save IBOM changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraftComponents(savedSnapshot.map(s => ({ ...s })));
    setUpaErrors(new Set());
    prevUpaValues.current.clear();
    setCheckedAllowable(new Set());
    setConfirmingRemoveId(null);
  };

  // ═══ DRAFT MUTATIONS (local only) ═══
  const handleAddChecked = () => {
    if (!editParentId || checkedAllowable.size === 0) return;
    const newDrafts: DraftComponent[] = [];
    checkedAllowable.forEach(pId => {
      newDrafts.push({
        id: crypto.randomUUID(),
        component_product_id: pId,
        units_per_assy: 1,
        isNew: true,
      });
    });
    setDraftComponents(prev => [...prev, ...newDrafts]);
    toast.info(`${checkedAllowable.size} component(s) staged`);
    setCheckedAllowable(new Set());
  };

  const handleAddAll = () => {
    const newDrafts: DraftComponent[] = allowableProducts.map(p => ({
      id: crypto.randomUUID(),
      component_product_id: p.id,
      units_per_assy: 1,
      isNew: true,
    }));
    setDraftComponents(prev => [...prev, ...newDrafts]);
    toast.info(`${allowableProducts.length} component(s) staged`);
  };

  const handleRemoveDraft = (draftId: string) => {
    setDraftComponents(prev => prev.filter(d => d.id !== draftId));
    setConfirmingRemoveId(null);
  };

  const handleRemoveAll = () => {
    setDraftComponents([]);
    setShowRemoveAllDialog(false);
  };

  const handleUpaChange = (entryId: string, value: string, currentValid: number) => {
    const num = Number(value);
    if (!prevUpaValues.current.has(entryId)) {
      prevUpaValues.current.set(entryId, currentValid);
    }
    if (value === '' || num <= 0) {
      setUpaErrors(prev => new Set(prev).add(entryId));
      return;
    }
    setUpaErrors(prev => { const n = new Set(prev); n.delete(entryId); return n; });
    setDraftComponents(prev => prev.map(d => d.id === entryId ? { ...d, units_per_assy: num } : d));
    prevUpaValues.current.set(entryId, num);
  };

  const handleUpaBlur = (entryId: string) => {
    if (upaErrors.has(entryId)) {
      const revert = prevUpaValues.current.get(entryId) || 1;
      setDraftComponents(prev => prev.map(d => d.id === entryId ? { ...d, units_per_assy: revert } : d));
      setUpaErrors(prev => { const n = new Set(prev); n.delete(entryId); return n; });
    }
  };

  // ═══ NAVIGATION GUARD: product switch within IBOM ═══
  const handleSelectRow = (productId: string) => {
    if (productId === selectedProductId) return;
    if (isDirty) {
      setPendingSwitchId(productId);
      return;
    }
    doSwitch(productId);
  };

  const doSwitch = (productId: string) => {
    setSelectedProductId(productId);
    setCheckedAllowable(new Set());
    setConfirmingRemoveId(null);
    setShowEmptyPicker(false);
    setPendingSwitchId(null);
  };

  const handleSaveAndSwitch = async () => {
    await handleSave();
    if (pendingSwitchId) doSwitch(pendingSwitchId);
  };

  const handleDiscardAndSwitch = () => {
    handleDiscard();
    if (pendingSwitchId) doSwitch(pendingSwitchId);
  };

  // ═══ NAVIGATION GUARD: route-level (beforeunload) ═══
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // No products empty state
  if (!model) return null;

  if (model.products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-fade-in gap-4 px-6">
        <div className="rounded-full bg-muted p-6">
          <Package className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-semibold">No products defined yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add products in the Products tab before building your IBOM structure.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/productdata')}
          className="gap-2"
        >
          Go to Products
        </Button>
      </div>
    );
  }

  const prodName = (id: string) => model.products.find((p) => p.id === id)?.name || '???';
  const allProducts = model.products;

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const allKeys = new Set<string>();
    const collectKeys = (nodes: TreeNode[], parentKey: string) => {
      nodes.forEach((n, i) => {
        const key = `${parentKey}-${n.productId}-${i}`;
        if (n.children.length > 0) { allKeys.add(key); collectKeys(n.children, key); }
      });
    };
    collectKeys(tree, 'root');
    setExpandedNodes(allKeys);
  };

  const filteredDropdownProducts = filterText
    ? allProducts.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()))
    : allProducts;

  const renderTreeNode = (node: TreeNode, parentKey: string, index: number) => {
    const key = `${parentKey}-${node.productId}-${index}`;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(key);
    const isSelected = selectedProductId === node.productId;
    const ufa = unitsPerFinalAssy.get(node.productId);

    return (
      <div key={key}>
        <div
          className={`flex items-center gap-2 h-9 px-4 cursor-pointer text-sm transition-colors border-l-4 border-b border-slate-100 ${
            isSelected
              ? 'bg-sky-50 border-l-[#2563EB]'
              : 'bg-white border-l-transparent hover:bg-slate-50/70'
          }`}
          style={{ paddingLeft: `${node.depth * 20 + 16}px` }}
          onClick={() => handleSelectRow(node.productId)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="shrink-0 p-0.5 rounded hover:bg-slate-200/50"
              onClick={(e) => toggleExpand(key, e)}
            >
              {isExpanded
                ? <ChevronDown className="h-4 w-4 text-slate-500" />
                : <ChevronRight className="h-4 w-4 text-slate-500" />
              }
            </button>
          ) : (
            <span className="w-4 shrink-0 text-center text-slate-300">—</span>
          )}
          {hasChildren ? (
            <Network className="h-4 w-4 text-sky-600 shrink-0" />
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className={`flex-1 min-w-0 truncate ${hasChildren ? 'font-medium text-slate-900' : 'text-slate-800'}`}>
            {node.productName}
          </span>
          <span className="font-mono text-sm text-slate-800 tabular-nums w-20 text-right shrink-0">
            {node.unitsPerAssy}
          </span>
          <span className="font-mono text-sm text-slate-600 tabular-nums w-24 text-right shrink-0">
            {ufa !== undefined ? ufa : '—'}
          </span>
        </div>
        {hasChildren && isExpanded && node.children.map((child, i) => renderTreeNode(child, key, i))}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-fade-in bg-[#F9FAFB]">
      {/* Alert banner — light yellow/amber */}
      {activeScenarioId && activeScenario && (
        <div className="mx-6 mt-4 mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm text-slate-800 font-medium">
            Changes recorded to <span className="font-semibold">{activeScenario.name}</span>
          </span>
        </div>
      )}
      {/* Page Header */}
      <div className="px-6 pt-2 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Indented Bill of Materials</h1>
            <p className="text-sm text-slate-600 mt-0.5">Define parent-child relationships between products and their component parts.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-slate-600">Go to:</span>
            <div className="flex rounded-md border border-slate-200 bg-white overflow-hidden">
              <Button variant="ghost" size="sm" className="h-8 rounded-none border-r border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100" onClick={() => router.push('/dashboard/productdata')}>
                Product Form
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-none text-xs font-medium text-slate-800 hover:bg-slate-100" onClick={() => router.push('/dashboard/operationsrouting')}>
                Operations
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Panels wrapper: takes remaining height so panels get a real height ═══ */}
      <div className="flex-1 min-h-0 flex flex-col px-6 pb-6 gap-3">
        {/* TOP PANEL — IBOM Structure: always full height (45%), never collapse when empty */}
        <div className="flex-[0_0_45%] min-h-[280px] flex flex-col px-0 pb-0 shrink-0">
          <div className="h-full min-h-[260px] flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">IBOM Structure</h2>
                {viewAssemblyId && tree.length > 0 && maxDepth > 0 && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {maxDepth} level{maxDepth !== 1 ? 's' : ''} deep
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-600">View assembly:</span>
                <Select value={viewAssemblyId} onValueChange={(v) => { setViewAssemblyId(v); setExpandedNodes(new Set()); setSelectedProductId(''); setFilterText(''); }}>
                  <SelectTrigger className="h-8 w-48 text-sm border border-slate-200 bg-white text-slate-900 rounded-md shadow-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-0 placeholder:text-slate-400 [&>svg]:text-slate-500">
                    <SelectValue placeholder="Select assembly..." />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-200 bg-white rounded-md shadow-lg min-w-[var(--radix-select-trigger-width)]">
                    {allProducts.map((p) => {
                      const compCount = model.ibom.filter(e => e.parent_product_id === p.id).length;
                      return (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="text-slate-900 data-[highlighted]:bg-[#0D9488] data-[highlighted]:text-white data-[state=checked]:bg-[#0D9488] data-[state=checked]:text-white rounded-sm py-2 pl-8 pr-3 cursor-pointer"
                        >
                          {p.name}
                          {compCount > 0 && <span className="ml-1 opacity-90">({compCount})</span>}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {viewAssemblyId && (
                  <>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      onClick={() => { setViewAssemblyId(''); setSelectedProductId(''); setExpandedNodes(new Set()); setFilterText(''); }}
                      aria-label="Clear"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 text-slate-700 bg-white" onClick={() => { setViewAssemblyId(''); setSelectedProductId(''); setExpandedNodes(new Set()); setFilterText(''); }}>
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
            {viewAssemblyId && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filter products..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="h-8 pl-9 pr-9 text-sm border-slate-200 bg-white rounded-md"
                />
                {filterText && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setFilterText('')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {!viewAssemblyId ? (
              <div className="flex-1 flex items-center justify-center min-h-[180px] text-sm text-slate-500 px-4">
                Select an assembly above to view its structure.
              </div>
            ) : (
              <div className="text-sm">
                {/* Table header — exact match to image */}
                <div className="flex items-center gap-2 h-10 px-4 border-b border-slate-200 bg-slate-50/80 text-slate-900 font-semibold sticky top-0 z-10">
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <span>Component</span>
                    <button type="button" className="text-left text-xs font-normal text-sky-600 hover:underline" onClick={expandAll}>
                      Expand All
                    </button>
                  </div>
                  <span className="w-20 text-right shrink-0">Units/Assy</span>
                  <span className="w-24 text-right shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help underline decoration-dotted">Units/Final</TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          Total units of this component needed per 1 good final assembly across all IBOM levels. Scrap excluded.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                {/* Root assembly row */}
                <div
                  className={`flex items-center gap-2 h-9 px-4 cursor-pointer transition-colors border-l-4 border-b border-slate-100 ${
                    selectedProductId === viewAssemblyId
                      ? 'bg-sky-50 border-l-[#2563EB]'
                      : 'bg-white border-l-transparent hover:bg-slate-50/70'
                  }`}
                  onClick={() => handleSelectRow(viewAssemblyId)}
                >
                  {tree.length > 0 ? (
                    <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                  ) : (
                    <span className="w-4 shrink-0 text-center text-slate-300">—</span>
                  )}
                  <Network className="h-4 w-4 text-sky-600 shrink-0" />
                  <span className="font-medium text-slate-900">{prodName(viewAssemblyId)}</span>
                  <span className="ml-auto w-20 text-right font-mono text-sm text-slate-500">—</span>
                  <span className="w-24 text-right font-mono text-sm text-slate-500">—</span>
                </div>
                {tree.length === 0 && (
                  <div className="pl-12 py-2 text-xs text-slate-500 border-b border-slate-100">
                    Click the row above to add components.
                  </div>
                )}
                {filteredTree.map((node, i) => renderTreeNode(node, 'root', i))}
                {filterText && filteredTree.length === 0 && tree.length > 0 && (
                  <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                    No matching products found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
        {/* ═══ BOTTOM PANEL — Edit Components (takes remaining ~55%, same visual weight as top) ═══ */}
        <div className="flex-1 min-h-[200px] flex flex-col overflow-hidden">
        <div className="h-full min-h-0 flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {editParentId
                ? <>Components for: <span className="text-[#0D9488]">{prodName(editParentId)}</span></>
                : 'Edit Components'
              }
            </h2>
            {editParentId && isWhatIfTarget && (
              <span className="inline-flex items-center mt-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                What-if active
              </span>
            )}
          </div>
          <div className="p-4 flex-1 min-h-0 overflow-y-auto">
            {!editParentId ? (
              <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                Click any product in the tree above to edit its components.
              </div>
            ) : draftComponents.length === 0 && !showEmptyPicker ? (
              /* ── Empty state: no components (exact image match) ── */
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="rounded-full bg-slate-100 p-4">
                  <GitBranch className="h-10 w-10 text-slate-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-bold text-slate-900">{prodName(editParentId)} has no components yet</p>
                  <p className="text-sm text-slate-500">Add components below to define the bill of materials for this product.</p>
                </div>
                <Button size="sm" className="gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium rounded-md h-9 px-4" onClick={() => setShowEmptyPicker(true)}>
                  <PlusCircle className="h-4 w-4" /> Add Components
                </Button>
              </div>
            ) : draftComponents.length === 0 && showEmptyPicker ? (
              /* ── Empty state with inline picker ── */
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-2 pt-4 pb-2">
                  <p className="text-sm font-medium text-slate-900">{prodName(editParentId)} has no components yet</p>
                  <p className="text-xs text-slate-500">Select components to add:</p>
                </div>
                <div className="max-w-md mx-auto">
                  {allProducts.length <= 1 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No other products exist. Add products in the Products tab first.</p>
                  ) : allowableProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">All valid components have already been added.</p>
                  ) : (
                    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                      <div className="max-h-48 overflow-y-auto">
                        {allowableProducts.map((p, i) => (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                          >
                            <Checkbox
                              className="h-4 w-4 border-slate-300"
                              checked={checkedAllowable.has(p.id)}
                              onCheckedChange={(checked) => {
                                setCheckedAllowable(prev => { const n = new Set(prev); if (checked) n.add(p.id); else n.delete(p.id); return n; });
                              }}
                            />
                            <span className="flex-1 truncate text-slate-800">{p.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 p-3 border-t border-slate-200 bg-slate-50/80">
                        <Button size="sm" className="h-8 text-sm bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-md" onClick={handleAddChecked} disabled={checkedAllowable.size === 0}>
                          Add Selected
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-sm border-slate-200 text-slate-700 bg-white rounded-md" onClick={handleAddAll} disabled={allowableProducts.length === 0}>
                          Add All ({allowableProducts.length})
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Two-column editing layout (exact image match) ── */
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Current Components */}
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Current Components</p>
                  <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                    {draftComponents.map((c) => {
                      const isConfirming = confirmingRemoveId === c.id;
                      const hasError = upaErrors.has(c.id);
                      const isUpaChanged = changedUpaIds.has(c.id);
                      const isNewlyAdded = !!c.isNew;
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center gap-2 px-3 py-2 border-b border-slate-100 last:border-0 ${
                            isConfirming ? 'bg-red-50' : ''
                          } ${isUpaChanged ? 'border-l-2 border-l-amber-400' : ''}`}
                        >
                          {isConfirming ? (
                            <div className="flex items-center justify-between w-full text-xs">
                              <span className="text-red-600 font-medium">Remove {prodName(c.component_product_id)}?</span>
                              <div className="flex gap-1">
                                <Button variant="destructive" size="sm" className="h-6 text-xs px-2 rounded" onClick={() => handleRemoveDraft(c.id)}>
                                  Confirm
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setConfirmingRemoveId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className={`flex-1 text-sm truncate text-slate-800 ${isNewlyAdded ? 'font-medium text-sky-600' : ''}`}>
                                {prodName(c.component_product_id)}
                              </span>
                              <div className="shrink-0">
                                <Input
                                  type="number"
                                  className={`h-8 w-14 text-sm font-mono text-center border-slate-200 rounded ${hasError ? 'border-red-500' : isUpaChanged ? 'border-amber-400' : ''}`}
                                  defaultValue={c.units_per_assy}
                                  key={`${c.id}-${savedSnapshot.find(s => s.id === c.id)?.units_per_assy ?? 'new'}`}
                                  min={1}
                                  onChange={(e) => handleUpaChange(c.id, e.target.value, c.units_per_assy)}
                                  onBlur={() => handleUpaBlur(c.id)}
                                />
                                {hasError && <p className="text-[10px] text-red-600 mt-0.5">{'> 0'}</p>}
                              </div>
                              <button
                                type="button"
                                className="shrink-0 flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                onClick={() => setConfirmingRemoveId(c.id)}
                                title="Remove"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                    onClick={() => setShowRemoveAllDialog(true)}
                    disabled={draftComponents.length === 0}
                  >
                    Remove All
                  </button>
                </div>

                {/* Right: Available to add */}
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Available to add:</p>
                  <div className="rounded-lg border border-slate-200 overflow-hidden flex flex-col bg-white">
                    {allProducts.length <= 1 ? (
                      <p className="text-xs text-slate-500 p-3">No other products exist. Add products in the Products tab first.</p>
                    ) : allowableProducts.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3">All valid components have already been added.</p>
                    ) : (
                      <>
                        <div className="max-h-48 overflow-y-auto">
                          {allowableProducts.map((p, i) => (
                            <label
                              key={p.id}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                            >
                              <Checkbox
                                className="h-4 w-4 border-slate-300"
                                checked={checkedAllowable.has(p.id)}
                                onCheckedChange={(checked) => {
                                  setCheckedAllowable(prev => { const n = new Set(prev); if (checked) n.add(p.id); else n.delete(p.id); return n; });
                                }}
                              />
                              <span className="flex-1 truncate text-slate-800">{p.name}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2 p-3 border-t border-slate-200 bg-slate-50/80">
                          <Button size="sm" className="h-8 text-sm bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-md" onClick={handleAddChecked} disabled={checkedAllowable.size === 0}>
                            Add Selected
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-sm border-slate-200 text-slate-700 bg-white rounded-md" onClick={handleAddAll} disabled={allowableProducts.length === 0}>
                            Add All ({allowableProducts.length})
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SAVE / DISCARD ACTION BAR ═══ */}
            {isDirty && editParentId && !pendingSwitchId && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-700 font-medium">Unsaved changes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-sm border-slate-200" onClick={handleDiscard}>
                    Discard
                  </Button>
                  <Button size="sm" className="h-8 text-sm bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {/* ═══ INLINE SWITCH CONFIRMATION ═══ */}
            {pendingSwitchId && isDirty && editParentId && (
              <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">
                    You have unsaved changes for {prodName(editParentId)}. Save before switching?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-sm" onClick={() => setPendingSwitchId(null)}>
                    Stay
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-sm border-slate-200" onClick={handleDiscardAndSwitch}>
                    Discard & Switch
                  </Button>
                  <Button size="sm" className="h-8 text-sm bg-[#22C55E] hover:bg-[#16A34A] text-white" onClick={handleSaveAndSwitch}>
                    Save & Switch
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Remove All Confirmation Dialog */}
      <Dialog open={showRemoveAllDialog} onOpenChange={setShowRemoveAllDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove All Components</DialogTitle>
            <DialogDescription>
              Remove all {draftComponents.length} components from {editParentId ? prodName(editParentId) : ''}? You can discard this change before saving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRemoveAllDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveAll}>Remove All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
