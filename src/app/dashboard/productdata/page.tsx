"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useModelStore, type Product } from '@/stores/modelStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { DeleteConfirmInline } from '@/components/DeleteConfirmInline';
import { useScenarioStore } from '@/stores/scenarioStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/components/ui/DataTable';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, LayoutGrid, List, Copy, GitBranch, Network, ChevronDown, ChevronUp, CircleHelp, FlaskConical } from 'lucide-react';

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-400 shadow-sm cursor-help"
          >
            <CircleHelp className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[320px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


import { useUserLevelStore, isVisible } from '@/hooks/useUserLevel';
import { NoModelSelected } from '@/components/NoModelSelected';
import { toast } from 'sonner';

const FIELD_LABELS: Record<string, string> = {
  demand: 'End Demand', lot_size: 'Lot Size', tbatch_size: 'TBatch Size',
  demand_factor: 'Demand Factor', lot_factor: 'Lot Factor', var_factor: 'Var Factor',
  setup_factor: 'Setup Factor', make_to_stock: 'Make to Stock', gather_tbatches: 'Gather TBatches',
  dept_code: 'Dept/Area', prod1: 'Prod1', prod2: 'Prod2', prod3: 'Prod3', prod4: 'Prod4', comments: 'Comments',
};

export default function ProductData() {
  const model = useModelStore((s) => s.getActiveModel());
  const addProduct = useModelStore((s) => s.addProduct);
  const updateProduct = useModelStore((s) => s.updateProduct);
  const deleteProduct = useModelStore((s) => s.deleteProduct);
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { pendingDeleteId, requestDelete, cancelDelete, confirmDelete } = useDeleteConfirmation();
  const { userLevel } = useUserLevelStore();
  const showAdvancedParams = isVisible('advanced_parameters', userLevel);
  const activeScenarioId = useScenarioStore(s => s.activeScenarioId);
  const activeScenario = useScenarioStore(s => s.scenarios.find(sc => sc.id === s.activeScenarioId));
  const applyScenarioChange = useScenarioStore(s => s.applyScenarioChange);

  if (!model) return <NoModelSelected />;

  const contentCardClass = activeScenarioId
    ? 'border-0 border-l-[3px] border-l-amber-400 bg-white shadow-sm'
    : 'border-0 bg-white shadow-sm';

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (model.products.some((p) => p.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('A product with this name already exists');
      return;
    }
    addProduct(model.id, {
      id: crypto.randomUUID(), name: newName.trim().toUpperCase(), demand: 0, lot_size: 1,
      tbatch_size: -1, demand_factor: 1, lot_factor: 1, var_factor: 1, setup_factor: 1,
      make_to_stock: false, gather_tbatches: true, dept_code: '',
      prod1: 0, prod2: 0, prod3: 0, prod4: 0, comments: '',
    });
    setNewName('');
    setShowAdd(false);
    toast.success(`Product "${newName.trim().toUpperCase()}" added`);
  };

  const handleCopy = (p: Product) => {
    const newP: Product = { ...p, id: crypto.randomUUID(), name: `${p.name}_COPY` };
    addProduct(model.id, newP);
    toast.success(`Product "${newP.name}" created as copy`);
  };

  const handleCellChange = (id: string, field: keyof Product, value: any) => {
    if (activeScenarioId && activeScenario) {
      const prod = model.products.find(p => p.id === id);
      const entityName = prod?.name || id;
      const fieldLabel = FIELD_LABELS[field] || field;
      applyScenarioChange(activeScenarioId, 'Product', id, entityName, field, fieldLabel, value as string | number);
    }
    updateProduct(model.id, id, { [field]: value });
  };

  const goToOps = (productId: string) => {
    // For Next.js mock flow, route to the Operations & Routing dashboard page.
    // TODO: when models/[id]/operations route exists, update this to link there.
    router.push('/dashboard/operationsrouting');
  };

  const opsCount = (productId: string) => model.operations.filter((o) => o.product_id === productId).length;

  const ibomCount = (productId: string) => model.ibom.filter(e => e.parent_product_id === productId).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-fade-in bg-[#F9FAFB]">
      {activeScenarioId && activeScenario && (
        <div className="mx-6 mt-4 mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shrink-0">
          <FlaskConical className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm text-slate-800 font-medium">
            Changes recorded to <span className="font-semibold">{activeScenario.name}</span>
          </span>
        </div>
      )}

      {/* Page header */}
      <div className="px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Products</h1>
            <p className="text-sm text-slate-600">
              {model.products.length} products defined
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="h-8 gap-1 rounded-md border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Show Advanced
            </Button>
            <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-none ${viewMode === 'table' ? 'bg-slate-200 text-slate-800 hover:bg-slate-200' : 'hover:bg-slate-100'}`}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-none ${viewMode === 'form' ? 'bg-slate-200 text-slate-800 hover:bg-slate-200' : 'hover:bg-slate-100'}`}
                onClick={() => setViewMode('form')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setShowAdd(true)}
              size="sm"
              className="h-8 gap-1 rounded-md bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main content — same wrapper for empty, table, and cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-5xl">

      {model.products.length === 0 ? (
        <div className={`rounded-lg p-16 text-center ${contentCardClass}`}>
          <p className="text-slate-700 font-medium mb-1">No products defined</p>
          <p className="text-sm text-slate-500 mb-4">Add products to define demand, lot sizes, and IBOM structures.</p>
          <Button className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add First Product
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className={`rounded-lg overflow-hidden ${contentCardClass}`}>
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead className="font-mono text-xs">Name</DataTableHead>
                  <DataTableHead className="font-mono text-xs">
                    <TooltipProvider delayDuration={400}><Tooltip><TooltipTrigger asChild><span className="cursor-help">End Demand</span></TooltipTrigger><TooltipContent className="max-w-[260px] text-xs">Quantity shipped directly to customers. Set to 0 for components used only within assemblies; their production quantity will be calculated automatically from the IBOM.</TooltipContent></Tooltip></TooltipProvider>
                  </DataTableHead>
                  <DataTableHead className="font-mono text-xs">Lot Size</DataTableHead>
                  {showAdvanced && <>
                    <DataTableHead className="font-mono text-xs">TBatch</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Dept/Area</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Demand Fac</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Lot Fac</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Var Fac</DataTableHead>
                    
                    <DataTableHead className="font-mono text-xs">MTS</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Gather</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.prod1_name}</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.prod2_name}</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.prod3_name}</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.prod4_name}</DataTableHead>
                  </>}
                  <DataTableHead className="font-mono text-xs">Ops</DataTableHead>
                  <DataTableHead className="font-mono text-xs">IBOM</DataTableHead>
                  <DataTableHead className="font-mono text-xs">Comments</DataTableHead>
                  <DataTableHead className="w-24"></DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {model.products.map((p) => {
                  const isConfirming = pendingDeleteId === p.id;
                  return (
                  <DataTableRow key={p.id} className={isConfirming ? 'bg-destructive/10' : ''}>
                    {isConfirming ? (
                      <DataTableCell colSpan={showAdvanced ? 18 : 8}>
                        <DeleteConfirmInline
                          message={`Delete ${p.name}? This will remove its operations and IBOM data.`}
                          onConfirm={() => confirmDelete(p.id, () => deleteProduct(model.id, p.id))}
                          onCancel={cancelDelete}
                        />
                      </DataTableCell>
                    ) : (<>
                    <DataTableCell className="font-mono font-medium">{p.name}</DataTableCell>
                    <DataTableCell><Input type="number" className={`h-8 w-20 font-mono ${p.demand < 0 ? 'border-destructive' : ''}`} value={p.demand} onChange={(e) => handleCellChange(p.id, 'demand', +e.target.value)} /></DataTableCell>
                    <DataTableCell>
                      <Input type="number" className={`h-8 w-20 font-mono ${p.lot_size < 1 ? 'border-destructive' : ''}`} value={p.lot_size} onChange={(e) => handleCellChange(p.id, 'lot_size', +e.target.value)} />
                      {p.lot_size < 1 && <span className="text-[10px] text-destructive">≥ 1</span>}
                    </DataTableCell>
                    {showAdvanced && <>
                      <DataTableCell>
                        <Input type="number" className="h-8 w-20 font-mono" value={p.tbatch_size} onChange={(e) => handleCellChange(p.id, 'tbatch_size', +e.target.value)} />
                        <span className="text-[9px] text-muted-foreground">-1 = lot size</span>
                      </DataTableCell>
                      <DataTableCell><Input className="h-8 w-24" value={p.dept_code} onChange={(e) => handleCellChange(p.id, 'dept_code', e.target.value)} /></DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-1">
                          <Input type="number" className="h-8 w-20 font-mono" value={p.demand_factor} step="0.1" onChange={(e) => handleCellChange(p.id, 'demand_factor', +e.target.value)} />
                          <InfoTip text="Scales the product demand without changing the stored demand value. Set to 0 to effectively exclude this product from calculations while keeping its data." />
                        </div>
                      </DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={p.lot_factor} step="0.1" onChange={(e) => handleCellChange(p.id, 'lot_factor', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={p.var_factor} step="0.1" onChange={(e) => handleCellChange(p.id, 'var_factor', +e.target.value)} /></DataTableCell>
                      
                      <DataTableCell>
                        <div className="flex items-center gap-1">
                          <Switch checked={p.make_to_stock} onCheckedChange={(v) => handleCellChange(p.id, 'make_to_stock', v)} />
                          <InfoTip text="When checked, this component is assumed to be held in stock. Its MCT does not add to the parent assembly MCT. Use for Assemble-to-Order scenarios." />
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-1">
                          <Switch checked={p.gather_tbatches} onCheckedChange={(v) => handleCellChange(p.id, 'gather_tbatches', v)} />
                          <InfoTip text="When checked, the first transfer batch waits for the full lot before moving to stock. Uncheck if transfer batches are sent forward immediately as completed." />
                        </div>
                      </DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={p.prod1} onChange={(e) => handleCellChange(p.id, 'prod1', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={p.prod2} onChange={(e) => handleCellChange(p.id, 'prod2', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={p.prod3} onChange={(e) => handleCellChange(p.id, 'prod3', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={p.prod4} onChange={(e) => handleCellChange(p.id, 'prod4', +e.target.value)} /></DataTableCell>
                    </>}
                    <DataTableCell>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-mono" onClick={() => goToOps(p.id)}>
                        <GitBranch className="h-3 w-3" />{opsCount(p.id)}
                      </Button>
                    </DataTableCell>
                    <DataTableCell>
                      <TooltipProvider delayDuration={400}><Tooltip><TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 gap-1 text-xs font-mono ${ibomCount(p.id) === 0 ? 'text-muted-foreground' : ''}`}
                          onClick={() => router.push('/dashboard/ibomscreens')}
                        >
                          <Network className="h-3 w-3" />{ibomCount(p.id)}
                        </Button>
                      </TooltipTrigger><TooltipContent className="text-xs">View IBOM for {p.name}</TooltipContent></Tooltip></TooltipProvider>
                    </DataTableCell>
                    <DataTableCell><Input className="h-8 w-32" value={p.comments} onChange={(e) => handleCellChange(p.id, 'comments', e.target.value)} /></DataTableCell>
                    <DataTableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-300 text-emerald-600 hover:text-black-1000" onClick={() => handleCopy(p)} title="Duplicate"><Copy className="h-3.5 w-3.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => requestDelete(p.id)} title="Delete"><Trash2 className="h-3.5 w-3.5 text-red-600 hover:bg-red-50 hover:text-red-700" /></Button>
                      </div>
                    </DataTableCell>
                    </>)}
                  </DataTableRow>
                  );
                })}
              </DataTableBody>
            </DataTable>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {model.products.map((p) => (
            <Card
              key={p.id}
              className={activeScenarioId ? 'border-0 border-l-[3px] border-l-amber-400 bg-white shadow-sm' : 'border-0 bg-white shadow-sm'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">{p.name}</CardTitle>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7  hover:bg-emerald-300 text-emerald-600 hover:text-black-1000" onClick={() => handleCopy(p)}><Copy className="h-3.5 w-3.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { if (confirm(`Delete ${p.name}? This will remove its operations and IBOM data.`)) deleteProduct(model.id, p.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <TooltipProvider delayDuration={400}><Tooltip><TooltipTrigger asChild><Label className="text-xs cursor-help">End Demand</Label></TooltipTrigger><TooltipContent className="max-w-[260px] text-xs">Quantity shipped directly to customers. Set to 0 for components used only within assemblies; their production quantity will be calculated automatically from the IBOM.</TooltipContent></Tooltip></TooltipProvider>
                      <Input type="number" className="h-8 font-mono" value={p.demand} onChange={(e) => handleCellChange(p.id, 'demand', +e.target.value)} />
                    </div>
                    <div><Label className="text-xs">Lot Size</Label><Input type="number" className="h-8 font-mono" value={p.lot_size} onChange={(e) => handleCellChange(p.id, 'lot_size', +e.target.value)} /></div>
                  </div>
                  <div><Label className="text-xs">Comments</Label><Input className="h-8" value={p.comments} onChange={(e) => handleCellChange(p.id, 'comments', e.target.value)} /></div>
                  <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => goToOps(p.id)}>
                    <GitBranch className="h-3.5 w-3.5" /> Operations ({opsCount(p.id)})
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => router.push('/dashboard/ibomscreens')}>
                    <Network className="h-3.5 w-3.5" /> IBOM ({ibomCount(p.id)})
                  </Button>

                  {showAdvanced && (
                    <div className="pt-3 border-t border-border space-y-3">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Advanced Parameters</Label>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <Label className="text-xs">Transfer Batch</Label>
                            <Input type="number" className="h-8 font-mono" value={p.tbatch_size} onChange={(e) => handleCellChange(p.id, 'tbatch_size', +e.target.value)} />
                            <span className="text-[9px] text-muted-foreground">-1 = same as lot size (default)</span>
                          </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Demand Factor</Label>
                            <InfoTip text="Scales the product demand without changing the stored demand value. Set to 0 to effectively exclude this product from calculations while keeping its data." />
                          </div>
                          <Input type="number" className="h-8 font-mono" value={p.demand_factor} step="0.1" onChange={(e) => handleCellChange(p.id, 'demand_factor', +e.target.value)} />
                        </div>
                        <div><Label className="text-xs">Lot Factor</Label><Input type="number" className="h-8 font-mono" value={p.lot_factor} step="0.1" onChange={(e) => handleCellChange(p.id, 'lot_factor', +e.target.value)} /></div>
                        <div><Label className="text-xs">Var Factor</Label><Input type="number" className="h-8 font-mono" value={p.var_factor} step="0.1" onChange={(e) => handleCellChange(p.id, 'var_factor', +e.target.value)} /></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">Make to Stock</Label>
                          <InfoTip text="When checked, this component is assumed to be held in stock. Its MCT does not add to the parent assembly MCT. Use for Assemble-to-Order scenarios." />
                        </div>
                        <Switch checked={p.make_to_stock} onCheckedChange={(v) => handleCellChange(p.id, 'make_to_stock', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">Gather Transfer Batches</Label>
                          <InfoTip text="When checked, the first transfer batch waits for the full lot before moving to stock. Uncheck if transfer batches are sent forward immediately as completed." />
                        </div>
                        <Switch checked={p.gather_tbatches} onCheckedChange={(v) => handleCellChange(p.id, 'gather_tbatches', v)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">Group / Dept / Area</Label>
                          <TooltipProvider><Tooltip><TooltipTrigger asChild><CircleHelp className="h-3 w-3 text-muted-foreground" /></TooltipTrigger><TooltipContent className="max-w-[200px] text-xs">Products with the same Group label will be subtotalled together in the Output Summary.</TooltipContent></Tooltip></TooltipProvider>
                        </div>
                        <Input className="h-8" value={p.dept_code} placeholder="e.g. Hubs, Components" onChange={(e) => handleCellChange(p.id, 'dept_code', e.target.value)} />
                      </div>
                      {/* Prod1-4 parameter variables */}
                      <div className="pt-2 border-t border-border">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">Parameter Variables <InfoTip text="Use Display Name to rename the variable. The new label appears across the app and in the Formula Builder." /></Label>
                        <div className="grid grid-cols-4 gap-3 mt-1.5">
                          {(['prod1', 'prod2', 'prod3', 'prod4'] as const).map(key => (
                            <div key={key}>
                              <Label className="text-xs">{model.param_names[`${key}_name` as keyof typeof model.param_names]}</Label>
                              <Input type="number" className="h-8 font-mono" value={p[key]} onChange={(e) => handleCellChange(p.id, key, +e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <div><Label>Product Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., HUB1" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} /></div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}