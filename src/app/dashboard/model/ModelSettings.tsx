import { useState, useEffect } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { useResultsStore } from '@/stores/resultsStore';
import { db, getParamNames, getVersions, createVersion, getVersionSnapshot, updateVersionLabel, deleteVersion, restoreVersionToModel } from '@/lib/supabaseData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Save, Trash2, Archive, Download, RotateCcw, X, Plus, Clock, Pencil, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ParamNames {
  gen1_name: string; gen2_name: string; gen3_name: string; gen4_name: string;
  lab1_name: string; lab2_name: string; lab3_name: string; lab4_name: string;
  eq1_name: string; eq2_name: string; eq3_name: string; eq4_name: string;
  prod1_name: string; prod2_name: string; prod3_name: string; prod4_name: string;
  oper1_name: string; oper2_name: string; oper3_name: string; oper4_name: string;
}

const defaultParamNames: ParamNames = {
  gen1_name: 'Gen1', gen2_name: 'Gen2', gen3_name: 'Gen3', gen4_name: 'Gen4',
  lab1_name: 'Lab1', lab2_name: 'Lab2', lab3_name: 'Lab3', lab4_name: 'Lab4',
  eq1_name: 'Eq1', eq2_name: 'Eq2', eq3_name: 'Eq3', eq4_name: 'Eq4',
  prod1_name: 'Prod1', prod2_name: 'Prod2', prod3_name: 'Prod3', prod4_name: 'Prod4',
  oper1_name: 'Oper1', oper2_name: 'Oper2', oper3_name: 'Oper3', oper4_name: 'Oper4',
};

interface Version {
  id: string;
  label: string;
  created_at: string;
}

export default function ModelSettings() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'general';
  const model = useModelStore(s => s.getActiveModel());
  const renameModel = useModelStore(s => s.renameModel);
  const archiveModel = useModelStore(s => s.archiveModel);
  const deleteModel = useModelStore(s => s.deleteModel);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [paramNames, setParamNames] = useState<ParamNames>(defaultParamNames);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingVersionName, setEditingVersionName] = useState('');
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (!model) return;
    setName(model.name);
    setTitle(model.general.model_title);
    setDescription(model.description);
    setTags(model.tags);
    // Load param names (from backend or model payload)
    const pn = getParamNames(model.id) || model.param_names;
    if (pn) setParamNames(pn);
    loadVersions();
  }, [model?.id]);

  const loadVersions = async () => {
    if (!model) return;
    const list = await getVersions(model.id);
    setVersions(list);
  };

  const handleRenameVersion = async (versionId: string) => {
    if (!editingVersionName.trim()) return;
    await updateVersionLabel(versionId, editingVersionName.trim());
    toast.success('Checkpoint renamed');
    setEditingVersionId(null);
    loadVersions();
  };

  const handleDeleteVersion = async (versionId: string) => {
    await deleteVersion(versionId);
    toast.success('Checkpoint deleted');
    setDeleteVersionId(null);
    loadVersions();
  };

  if (!model) return null;

  const handleSaveName = () => {
    if (!name.trim()) return;
    renameModel(model.id, name.trim());
    toast.success('Model name updated');
  };

  const handleSaveDescription = () => {
    db.updateModel(model.id, { description });
    useModelStore.setState(s => ({
      models: s.models.map(m => m.id === model.id ? { ...m, description } : m),
    }));
    toast.success('Description saved');
  };

  const handleSaveTitle = () => {
    useModelStore.getState().updateGeneral(model.id, { model_title: title });
    toast.success('Report title saved');
  };

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    const updated = [...tags, newTag.trim()];
    setTags(updated);
    setNewTag('');
    db.updateModel(model.id, { tags: updated });
    useModelStore.setState(s => ({
      models: s.models.map(m => m.id === model.id ? { ...m, tags: updated } : m),
    }));
  };

  const handleRemoveTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    db.updateModel(model.id, { tags: updated });
    useModelStore.setState(s => ({
      models: s.models.map(m => m.id === model.id ? { ...m, tags: updated } : m),
    }));
  };

  const handleSaveParamNames = async () => {
    db.upsertParamNames(model.id, paramNames);
    useModelStore.setState(s => ({
      models: s.models.map(m => m.id === model.id ? { ...m, param_names: { ...paramNames }, updated_at: new Date().toISOString() } : m),
    }));
    toast.success('Parameter names saved');
  };

  const handleSaveCheckpoint = async () => {
    const pn = getParamNames(model.id) || paramNames;
    const snapshot = {
      general: model.general,
      labor: model.labor,
      equipment: model.equipment,
      products: model.products,
      operations: model.operations,
      routing: model.routing,
      ibom: model.ibom,
      param_names: pn,
    };
    await createVersion(model.id, 'Manual Checkpoint', snapshot);
    toast.success('Checkpoint saved');
    loadVersions();
  };

  const handleRestore = async (versionId: string) => {
    setIsRestoring(true);
    try {
      const data = await getVersionSnapshot(versionId);
      if (!data?.snapshot) {
        toast.error('Failed to load version snapshot');
        setIsRestoring(false);
        setRestoreVersionId(null);
        return;
      }

      const modelId = model.id;
      await restoreVersionToModel(versionId, modelId);

      useResultsStore.getState().clearAllForModel();
      await useModelStore.getState().loadModels(true);
      useModelStore.getState().setActiveModel(modelId);

      toast.success(`Model restored to checkpoint from ${new Date(data.created_at).toLocaleString()}`);
      navigate(`/models/${modelId}/general`);
    } catch (err) {
      console.error('Restore error:', err);
      toast.error('Failed to restore checkpoint');
    } finally {
      setIsRestoring(false);
      setRestoreVersionId(null);
    }
  };

  const handleExport = () => {
    const exportData = {
      name: model.name,
      description: model.description,
      tags: model.tags,
      general: model.general,
      labor: model.labor,
      equipment: model.equipment,
      products: model.products,
      operations: model.operations,
      routing: model.routing,
      ibom: model.ibom,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Model exported');
  };

  const handleDelete = () => {
    if (deleteConfirm !== model.name) return;
    deleteModel(model.id);
    setShowDelete(false);
    toast.success('Model deleted');
    window.location.href = '/library';
  };

  const paramField = (key: keyof ParamNames, label: string) => (
    <div key={key}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="h-8 font-mono text-sm"
        value={paramNames[key]}
        onChange={e => setParamNames(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <h1 className="text-xl font-bold mb-1">Model Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Configure model metadata, parameter labels, and manage versions.</p>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="params">Parameter Names</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Model Name (Library)</Label>
                <div className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} />
                  <Button size="sm" onClick={handleSaveName} disabled={!name.trim() || name === model.name}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                </div>
              </div>
              <div>
                <Label>Report Title</Label>
                <div className="flex gap-2">
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title for printed reports" />
                  <Button size="sm" onClick={handleSaveTitle} disabled={title === model.general.model_title}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="flex gap-2">
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <Button size="sm" className="mt-2" onClick={handleSaveDescription} disabled={description === model.description}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Description
                </Button>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button onClick={() => handleRemoveTag(t)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="h-8"
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddTag} disabled={!newTag.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="params" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Parameter Names</CardTitle>
              <CardDescription>Rename Gen1–4, Lab1–4, Eq1–4, Prod1–4, Oper1–4 labels for this model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">General Parameters</h4>
                <div className="grid grid-cols-4 gap-2">
                  {paramField('gen1_name', 'Gen1')}
                  {paramField('gen2_name', 'Gen2')}
                  {paramField('gen3_name', 'Gen3')}
                  {paramField('gen4_name', 'Gen4')}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Labor Parameters</h4>
                <div className="grid grid-cols-4 gap-2">
                  {paramField('lab1_name', 'Lab1')}
                  {paramField('lab2_name', 'Lab2')}
                  {paramField('lab3_name', 'Lab3')}
                  {paramField('lab4_name', 'Lab4')}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Equipment Parameters</h4>
                <div className="grid grid-cols-4 gap-2">
                  {paramField('eq1_name', 'Eq1')}
                  {paramField('eq2_name', 'Eq2')}
                  {paramField('eq3_name', 'Eq3')}
                  {paramField('eq4_name', 'Eq4')}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Product Parameters</h4>
                <div className="grid grid-cols-4 gap-2">
                  {paramField('prod1_name', 'Prod1')}
                  {paramField('prod2_name', 'Prod2')}
                  {paramField('prod3_name', 'Prod3')}
                  {paramField('prod4_name', 'Prod4')}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Operation Parameters</h4>
                <div className="grid grid-cols-4 gap-2">
                  {paramField('oper1_name', 'Oper1')}
                  {paramField('oper2_name', 'Oper2')}
                  {paramField('oper3_name', 'Oper3')}
                  {paramField('oper4_name', 'Oper4')}
                </div>
              </div>
              <Button onClick={handleSaveParamNames}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save Parameter Names
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Version History</CardTitle>
                  <CardDescription>Save and restore model checkpoints. {versions.length > 0 && `${versions.length} checkpoint${versions.length !== 1 ? 's' : ''} saved.`}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No checkpoints saved yet. Use the Checkpoint button in the context bar to save one.</p>
              ) : (
                <div className="space-y-2">
                  {versions.slice(0, visibleCount).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-md border border-border group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          {editingVersionId === v.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                className="h-7 text-sm w-48"
                                value={editingVersionName}
                                onChange={e => setEditingVersionName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRenameVersion(v.id)}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleRenameVersion(v.id)}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingVersionId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className={`text-sm font-semibold ${!v.label ? 'italic text-muted-foreground' : ''}`}>
                                {v.label || 'Unnamed Checkpoint'}
                              </span>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(v.created_at).toLocaleString()}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {editingVersionId !== v.id && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => { setEditingVersionId(v.id); setEditingVersionName(v.label || ''); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => setDeleteVersionId(v.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs ml-1" onClick={() => setRestoreVersionId(v.id)}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Restore
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {versions.length > visibleCount && (
                    <Button variant="ghost" className="w-full text-xs" onClick={() => setVisibleCount(c => c + 10)}>
                      <ChevronDown className="h-3.5 w-3.5 mr-1" /> Load more ({versions.length - visibleCount} remaining)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="mt-4 space-y-4">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border border-border">
                <div>
                  <p className="text-sm font-medium">Archive Model</p>
                  <p className="text-xs text-muted-foreground">Hide from main library. Can be restored.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { archiveModel(model.id); toast.success(model.is_archived ? 'Model restored' : 'Model archived'); }}>
                  <Archive className="h-3.5 w-3.5 mr-1" /> {model.is_archived ? 'Restore' : 'Archive'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-border">
                <div>
                  <p className="text-sm font-medium">Export Model</p>
                  <p className="text-xs text-muted-foreground">Download full model data as JSON.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Export
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-destructive/30 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Model</p>
                  <p className="text-xs text-muted-foreground">Permanently delete this model and all data.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>"{model.name}"</strong> and all its data. Type the model name to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder={model.name}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteConfirm !== model.name}>
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation dialog */}
      <AlertDialog open={!!restoreVersionId} onOpenChange={(open) => !open && setRestoreVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Checkpoint</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const rv = restoreVersionId ? versions.find(v => v.id === restoreVersionId) : null;
                return rv ? (
                  <>
                    Restore to checkpoint: <strong>"{rv.label || 'Unnamed'}"</strong> — saved on{' '}
                    <strong>{new Date(rv.created_at).toLocaleString()}</strong>?
                    <br /><br />
                    This will replace all current model data. This cannot be undone.
                  </>
                ) : 'Loading…';
              })()}
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

      {/* Delete checkpoint confirmation */}
      <AlertDialog open={!!deleteVersionId} onOpenChange={(open) => !open && setDeleteVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checkpoint</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const dv = deleteVersionId ? versions.find(v => v.id === deleteVersionId) : null;
                return dv ? (
                  <>Delete checkpoint <strong>"{dv.label || 'Unnamed'}"</strong>? This cannot be undone.</>
                ) : 'Loading…';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteVersionId && handleDeleteVersion(deleteVersionId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
