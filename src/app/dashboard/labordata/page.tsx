"use client"

import { useState } from 'react';
import { useModelStore, type LaborGroup } from '@/stores/modelStore';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { DeleteConfirmInline } from '@/components/DeleteConfirmInline';
import { useScenarioStore } from '@/stores/scenarioStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/components/ui/DataTable';
import { Plus, Trash2, LayoutGrid, List, Users, ChevronDown, ChevronUp, FlaskConical, CircleHelp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserLevelStore, isVisible } from '@/hooks/useUserLevel';
import { NoModelSelected } from '@/components/NoModelSelected';

const FIELD_LABELS: Record<string, string> = {
  count: 'Count', overtime_pct: 'Overtime %', unavail_pct: 'Unavail %',
  dept_code: 'Dept/Area', setup_factor: 'Setup Factor', run_factor: 'Run Factor',
  var_factor: 'Var Factor', prioritize_use: 'Prioritize Use',
  lab1: 'Lab1', lab2: 'Lab2', lab3: 'Lab3', lab4: 'Lab4', comments: 'Comments',
};



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

export default function LaborData() {
  const model = useModelStore((s) => s.getActiveModel());
  const addLabor = useModelStore((s) => s.addLabor);
  const updateLabor = useModelStore((s) => s.updateLabor);
  const deleteLabor = useModelStore((s) => s.deleteLabor);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { pendingDeleteId, requestDelete, cancelDelete, confirmDelete } = useDeleteConfirmation();
  const { userLevel } = useUserLevelStore();
  const activeScenarioId = useScenarioStore(s => s.activeScenarioId);
  const activeScenario = useScenarioStore(s => s.scenarios.find(sc => sc.id === s.activeScenarioId));
  const applyScenarioChange = useScenarioStore(s => s.applyScenarioChange);

  if (!model) return <NoModelSelected />;

  const contentCardClass = activeScenarioId
    ? 'border-0 border-l-[3px] border-l-amber-400 bg-white shadow-sm'
    : 'border-0 bg-white shadow-sm';

  const handleAdd = () => {
    if (!newName.trim()) return;
    addLabor(model.id, {
      id: crypto.randomUUID(), name: newName.trim().toUpperCase(), count: 1,
      overtime_pct: 0, unavail_pct: 0, dept_code: '', prioritize_use: false,
      setup_factor: 1, run_factor: 1, var_factor: 1,
      lab1: 0, lab2: 0, lab3: 0, lab4: 0, comments: '',
    });
    setNewName('');
    setShowAdd(false);
  };

  const handleCellChange = (id: string, field: keyof LaborGroup, value: string | number | boolean) => {
    if (activeScenarioId && activeScenario) {
      const labor = model.labor.find(l => l.id === id);
      const entityName = labor?.name || id;
      const fieldLabel = FIELD_LABELS[field] || field;
      applyScenarioChange(activeScenarioId, 'Labor', id, entityName, field, fieldLabel, value as string | number);
    }
    updateLabor(model.id, id, { [field]: value });
  };

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
            <h1 className="text-xl font-bold text-slate-900">Labor Groups</h1>
            <p className="text-sm text-slate-600">
              {model.labor.length} groups defined
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
                variant={viewMode === 'table' ? 'ghost' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-none ${viewMode === 'table' ? 'bg-slate-200 text-slate-800 hover:bg-slate-200' : 'hover:bg-slate-100'}`}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'form' ? 'ghost' : 'ghost'}
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
              <Plus className="h-4 w-4" /> Add Labor Group
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

      {model.labor.length === 0 ? (
        <div className={`rounded-lg p-16 text-center ${contentCardClass}`}>
          <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-700 font-medium mb-1">No labor groups defined</p>
          <p className="text-sm text-slate-500 mb-4">Add labor groups to define worker pools for your operations.</p>
          <Button onClick={() => setShowAdd(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add First Labor Group
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className={`rounded-lg overflow-hidden ${contentCardClass}`}>
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead className="font-mono text-xs">Name</DataTableHead>
                  <DataTableHead className="font-mono text-xs">Count</DataTableHead>
                  <DataTableHead className="font-mono text-xs">Overtime %</DataTableHead>
                  <DataTableHead className="font-mono text-xs">Unavail %</DataTableHead>
                  {showAdvanced && <>
                    <DataTableHead className="font-mono text-xs">Dept/Area</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Setup Fac</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Run Fac</DataTableHead>
                    <DataTableHead className="font-mono text-xs">Var Fac</DataTableHead>
                    <DataTableHead className="font-mono text-xs">
                      <div className="flex items-center gap-1">Prioritize <InfoTip text="When enabled, MPX shifts labor time toward more heavily utilised equipment groups served by this labor group, reducing wait-for-labor time at bottlenecks." /></div>
                    </DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.lab1_name}</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.lab2_name}</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.lab3_name}</DataTableHead>
                    <DataTableHead className="font-mono text-xs">{model.param_names.lab4_name}</DataTableHead>
                  </>}
                  <DataTableHead className="w-10"></DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {model.labor.map((l) => {
                  const isConfirming = pendingDeleteId === l.id;
                  return (
                  <DataTableRow key={l.id} className={isConfirming ? 'bg-destructive/10' : ''}>
                    {isConfirming ? (
                      <DataTableCell colSpan={showAdvanced ? 14 : 5}>
                        <DeleteConfirmInline
                          message={`Delete ${l.name}? This will remove it from any equipment assignments.`}
                          onConfirm={() => confirmDelete(l.id, () => deleteLabor(model.id, l.id))}
                          onCancel={cancelDelete}
                        />
                      </DataTableCell>
                    ) : (<>
                    <DataTableCell className="font-mono font-medium">{l.name}</DataTableCell>
                    <DataTableCell>
                      <Input type="number" className="h-8 w-20 font-mono" value={l.count} onChange={(e) => handleCellChange(l.id, 'count', +e.target.value)} />
                    </DataTableCell>
                    <DataTableCell>
                      <Input type="number" className="h-8 w-20 font-mono" value={l.overtime_pct} onChange={(e) => handleCellChange(l.id, 'overtime_pct', +e.target.value)} />
                    </DataTableCell>
                    <DataTableCell>
                      <Input type="number" className="h-8 w-20 font-mono" value={l.unavail_pct} onChange={(e) => handleCellChange(l.id, 'unavail_pct', +e.target.value)} />
                    </DataTableCell>
                    {showAdvanced && <>
                      <DataTableCell><Input className="h-8 w-24" value={l.dept_code} onChange={(e) => handleCellChange(l.id, 'dept_code', e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.setup_factor} step="0.1" onChange={(e) => handleCellChange(l.id, 'setup_factor', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.run_factor} step="0.1" onChange={(e) => handleCellChange(l.id, 'run_factor', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.var_factor} step="0.1" onChange={(e) => handleCellChange(l.id, 'var_factor', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Switch checked={l.prioritize_use} onCheckedChange={(v) => handleCellChange(l.id, 'prioritize_use', v)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.lab1} onChange={(e) => handleCellChange(l.id, 'lab1', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.lab2} onChange={(e) => handleCellChange(l.id, 'lab2', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.lab3} onChange={(e) => handleCellChange(l.id, 'lab3', +e.target.value)} /></DataTableCell>
                      <DataTableCell><Input type="number" className="h-8 w-20 font-mono" value={l.lab4} onChange={(e) => handleCellChange(l.id, 'lab4', +e.target.value)} /></DataTableCell>
                    </>}
                    <DataTableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => requestDelete(l.id)}>
                        <Trash2 className="h-4 w-4 text-red-600 hover:bg-red-50 hover:text-red-700" />
                      </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {model.labor.map((l) => (
            <Card key={l.id} className={activeScenarioId ? 'border-0 border-l-[3px] border-l-amber-400 bg-white shadow-sm' : 'border-0 bg-white shadow-sm'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">{l.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { if (confirm(`Delete ${l.name}? This will remove it from any equipment assignments.`)) deleteLabor(model.id, l.id); }}>
                    <Trash2 className="h-4 w-4 text-red-600 hover:bg-red-50 hover:text-red-700" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Count</Label><Input type="number" className="h-8 font-mono" value={l.count} onChange={(e) => handleCellChange(l.id, 'count', +e.target.value)} /></div>
                  <div><Label className="text-xs">Overtime %</Label><Input type="number" className="h-8 font-mono" value={l.overtime_pct} onChange={(e) => handleCellChange(l.id, 'overtime_pct', +e.target.value)} /></div>
                  <div><Label className="text-xs">Unavail %</Label><Input type="number" className="h-8 font-mono" value={l.unavail_pct} onChange={(e) => handleCellChange(l.id, 'unavail_pct', +e.target.value)} /></div>
                  <div><Label className="text-xs">Dept Code</Label><Input className="h-8" value={l.dept_code} onChange={(e) => handleCellChange(l.id, 'dept_code', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs">Comments</Label><Input className="h-8" value={l.comments} onChange={(e) => handleCellChange(l.id, 'comments', e.target.value)} /></div>
                {showAdvanced && (
                  <div className="pt-2 border-t border-border space-y-3">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Advanced Parameters</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Setup Factor</Label><Input type="number" className="h-8 font-mono" value={l.setup_factor} step="0.1" onChange={(e) => handleCellChange(l.id, 'setup_factor', +e.target.value)} /><span className="text-[10px] text-muted-foreground">× {l.setup_factor} = {Math.round(l.setup_factor * 100)}%</span></div>
                      <div><Label className="text-xs">Run Factor</Label><Input type="number" className="h-8 font-mono" value={l.run_factor} step="0.1" onChange={(e) => handleCellChange(l.id, 'run_factor', +e.target.value)} /><span className="text-[10px] text-muted-foreground">× {l.run_factor} = {Math.round(l.run_factor * 100)}%</span></div>
                      <div>
                        <Label className="text-xs">Variability</Label>
                        <Input type="number" className="h-8 font-mono" value={l.var_factor} step="0.1" onChange={(e) => handleCellChange(l.id, 'var_factor', +e.target.value)} />
                        <span className="text-[10px] text-muted-foreground">Effective: {model.general.var_labor}% × {l.var_factor} = {(model.general.var_labor * l.var_factor).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Group / Dept / Area</Label>
                        <InfoTip text="Optional organisational label. No direct effect on calculations — provided for reference and model documentation." />
                      </div>
                      <Input className="h-8" value={l.dept_code} placeholder="e.g. Assembly, Machining" onChange={(e) => handleCellChange(l.id, 'dept_code', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Prioritize Use</Label>
                        <InfoTip text="When enabled, MPX shifts labor time toward more heavily utilised equipment groups served by this labor group, reducing wait-for-labor time at bottlenecks." />
                      </div>
                      <Switch checked={l.prioritize_use} onCheckedChange={(v) => handleCellChange(l.id, 'prioritize_use', v)} />
                    </div>
                    {/* Lab1-4 parameter variables */}
                    <div className="pt-2 border-t border-border">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">Parameter Variables <InfoTip text="Use Display Name to rename the variable. The new label appears across the app and in the Formula Builder." /></Label>
                      <div className="grid grid-cols-4 gap-3 mt-1.5">
                        {(['lab1', 'lab2', 'lab3', 'lab4'] as const).map(key => (
                          <div key={key}>
                            <Label className="text-xs">{model.param_names[`${key}_name` as keyof typeof model.param_names]}</Label>
                            <Input type="number" className="h-8 font-mono" value={l[key]} onChange={(e) => handleCellChange(l.id, key, +e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Labor Group</DialogTitle></DialogHeader>
          <div><Label>Labor Group Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., MACHINST" autoFocus /></div>
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
