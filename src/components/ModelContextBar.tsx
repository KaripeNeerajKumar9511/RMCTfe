import { useState, useEffect, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useResultsStore } from '@/stores/resultsStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Download, CircleDot, FlaskConical, CheckCircle, ChevronDown, RotateCcw, Clock, History, RefreshCw } from 'lucide-react';
import { UserLevelChip } from '@/components/UserLevelChip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getVersions, createVersion, getVersionSnapshot, restoreVersionToModel } from '@/lib/supabaseData';
import { toast } from 'sonner';
import { useRunCalculation } from '@/hooks/useRunCalculation';

interface RecentVersion {
  id: string;
  label: string;
  created_at: string;
}

export function ModelContextBar() {
  const model = useModelStore((s) => s.getActiveModel());
  const activeScenario = useScenarioStore((s) => s.getActiveScenario());
  const navigate = useNavigate();
  const { isRunning, handleRun: sharedRun } = useRunCalculation();
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false);
  const [recentVersions, setRecentVersions] = useState<RecentVersion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadRecentVersions = useCallback(async () => {
    if (!model) return;
    const list = await getVersions(model.id);
    setRecentVersions(list.slice(0, 5));
  }, [model?.id]);

  useEffect(() => {
    loadRecentVersions();
  }, [loadRecentVersions]);

  if (!model) return null;

  const statusConfig = {
    never_run: { label: 'Never Run', className: 'bg-muted text-muted-foreground' },
    current: { label: 'Results Current', className: 'bg-success text-success-foreground' },
    needs_recalc: { label: 'Recalc Needed', className: 'bg-warning text-warning-foreground' },
  };

  const status = statusConfig[model.run_status];
  const isResultsCurrent = model.run_status === 'current';

  const handleRun = () => sharedRun('full');

  // ── Open checkpoint dialog ──────────────────────────────────────
  const handleOpenCheckpointDialog = () => {
    const now = new Date();
    const defaultName = `Checkpoint ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setCheckpointName(defaultName);
    setShowCheckpointDialog(true);
  };

  // ── Save Checkpoint ─────────────────────────────────────────────
  const handleSaveCheckpoint = async () => {
    if (!checkpointName.trim()) return;
    setIsSavingCheckpoint(true);
    try {
      const snapshot = {
        general: model.general,
        labor: model.labor,
        equipment: model.equipment,
        products: model.products,
        operations: model.operations,
        routing: model.routing,
        ibom: model.ibom,
        param_names: model.param_names,
      };
      await createVersion(model.id, checkpointName.trim(), snapshot);
      toast.success(`Checkpoint saved: ${checkpointName.trim()}`);
      setShowCheckpointDialog(false);
      loadRecentVersions();
    } catch (err) {
      console.error('Checkpoint error:', err);
      toast.error('Failed to save checkpoint');
    } finally {
      setIsSavingCheckpoint(false);
    }
  };

  // ── Export Model as JSON ────────────────────────────────────────
  const handleExport = async () => {
    const exportData = {
      name: model.name, description: model.description, tags: model.tags,
      general: model.general, labor: model.labor, equipment: model.equipment,
      products: model.products, operations: model.operations, routing: model.routing,
      ibom: model.ibom, param_names: model.param_names,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `${model.name.replace(/\s+/g, '-')}-export-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Model exported as JSON');
  };

  // ── Restore from dropdown ───────────────────────────────────────
  const handleRestore = async (versionId: string) => {
    setIsRestoring(true);
    try {
      await restoreVersionToModel(versionId, model.id);
      useResultsStore.getState().clearAllForModel();
      await useModelStore.getState().loadModels(true);
      useModelStore.getState().setActiveModel(model.id);

      const v = recentVersions.find(v => v.id === versionId);
      toast.success(`Restored to: ${v?.label || 'checkpoint'}`);
      setDropdownOpen(false);
    } catch (err) {
      console.error('Restore error:', err);
      toast.error('Failed to restore checkpoint');
    } finally {
      setIsRestoring(false);
      setRestoreVersionId(null);
    }
  };

  // ── Tooltip text ────────────────────────────────────────────────
  const scenarioLabel = activeScenario ? activeScenario.name : 'Basecase';
  const runTooltip = `Quick recalculate — runs Full Calculate on ${scenarioLabel}`;
  const statusTooltip = model.run_status === 'current'
    ? `Last calculated: ${model.last_run_at ? new Date(model.last_run_at).toLocaleString() : 'unknown'}`
    : model.run_status === 'needs_recalc'
      ? `Results are stale — data changed${model.last_run_at ? ` since last run on ${new Date(model.last_run_at).toLocaleString()}` : ''}`
      : 'Model has never been run';
  const checkpointTooltip = 'Save a version checkpoint you can restore later';
  const exportTooltip = 'Download this model as a JSON file';

  const restoreVersion = restoreVersionId ? recentVersions.find(v => v.id === restoreVersionId) : null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-11 bg-context-bar text-context-bar-foreground flex items-center px-2 md:px-4 gap-1.5 md:gap-3 border-b border-sidebar-border shrink-0 overflow-x-auto">
        {/* Spacer for mobile hamburger */}
        <div className="w-8 shrink-0 md:hidden" />
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium truncate max-w-[120px] md:max-w-[200px]">{model.name}</span>
        </button>

        <div className="h-4 w-px bg-sidebar-border" />

        {activeScenario ? (
          <button onClick={() => navigate(`/models/${model.id}/whatif`)} className="shrink-0 hidden sm:flex">
            <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-600 text-xs font-medium cursor-pointer hover:bg-amber-500/20 transition-colors">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
              What-if: {activeScenario.name}
            </Badge>
          </button>
        ) : (
          <Badge variant="outline" className="border-primary/40 text-primary text-xs font-mono shrink-0 hidden sm:flex">
            <CircleDot className="h-2.5 w-2.5 mr-1" />
            Basecase
          </Badge>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`text-xs cursor-default ${status.className}`}>
              {status.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs">{statusTooltip}</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <UserLevelChip />

        <div className="flex items-center gap-1.5">
          {/* Checkpoint button + dropdown */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-context-bar-foreground hover:text-primary hover:bg-sidebar-accent rounded-r-none" onClick={handleOpenCheckpointDialog}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Checkpoint
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{checkpointTooltip}</TooltipContent>
            </Tooltip>
            <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-6 px-0 text-context-bar-foreground hover:text-primary hover:bg-sidebar-accent rounded-l-none border-l border-sidebar-border">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end" sideOffset={6}>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground">Recent Checkpoints</p>
                </div>
                {recentVersions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No checkpoints yet</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {recentVersions.map(v => (
                      <div key={v.id} className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors group">
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="text-sm font-medium truncate">{v.label || 'Unnamed Checkpoint'}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(v.created_at).toLocaleString()}</p>
                        </div>
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => { setRestoreVersionId(v.id); }}
                        >
                          <RotateCcw className="h-2.5 w-2.5 mr-0.5" /> Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-border px-3 py-2">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate(`/models/${model.id}/settings`); }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <History className="h-3 w-3" /> View all checkpoints
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-context-bar-foreground hover:text-primary hover:bg-sidebar-accent" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{exportTooltip}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="h-7 text-xs relative" onClick={handleRun} disabled={isRunning}>
                {isRunning ? (
                  <><span className="animate-spin h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full mr-1" /> Running…</>
                ) : (
                  <>
                    {isResultsCurrent ? (
                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-success" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span className="hidden lg:inline">Recalculate</span>
                    <span className="lg:hidden">Run</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{runTooltip}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Checkpoint Name Dialog */}
      <Dialog open={showCheckpointDialog} onOpenChange={setShowCheckpointDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Checkpoint</DialogTitle>
            <DialogDescription>
              Save a snapshot of the current model state that you can restore later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="checkpoint-name">Checkpoint Name</Label>
              <Input
                id="checkpoint-name"
                value={checkpointName}
                onChange={e => setCheckpointName(e.target.value)}
                placeholder="e.g. Before lot size changes"
                className="mt-1"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && checkpointName.trim() && handleSaveCheckpoint()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              {new Date().toLocaleString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckpointDialog(false)} disabled={isSavingCheckpoint}>Cancel</Button>
            <Button onClick={handleSaveCheckpoint} disabled={!checkpointName.trim() || isSavingCheckpoint}>
              {isSavingCheckpoint ? 'Saving…' : 'Save Checkpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation from dropdown */}
      <AlertDialog open={!!restoreVersionId} onOpenChange={(open) => !open && setRestoreVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Checkpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Restore to checkpoint: <strong>"{restoreVersion?.label || 'Unnamed'}"</strong> — saved on{' '}
              <strong>{restoreVersion ? new Date(restoreVersion.created_at).toLocaleString() : '...'}</strong>?
              <br /><br />
              This will replace all current model data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRestoring}
              onClick={() => restoreVersionId && handleRestore(restoreVersionId)}
            >
              {isRestoring ? 'Restoring…' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
