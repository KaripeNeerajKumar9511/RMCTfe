"use client";

import { useModelStore } from '@/stores/modelStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { Package, Cpu, Users, Play, Settings2, FlaskConical, ArrowRight } from 'lucide-react';
import { NoModelSelected } from '@/components/NoModelSelected';

const PATH_TO_ROUTE: Record<string, string> = {
  general: '/dashboard/generaldata',
  labor: '/dashboard/labordata',
  equipment: '/dashboard/eqipmentdata',
  products: '/dashboard/productdata',
  run: '/dashboard/runresults',
  whatif: '/dashboard/whatif',
};

export default function ModelOverview() {
  const model = useModelStore((s) => s.getActiveModel());
  const scenarios = useScenarioStore((s) => s.scenarios);
  const router = useRouter();

  if (!model) return <NoModelSelected />;

  const modelScenarios = scenarios.filter(s => s.modelId === model.id);
  const title = model.general.model_title || model.name;
  const description = model.description || 'No description';

  const quickLinks = [
    { label: 'General Data', path: 'general', icon: Settings2 },
    { label: 'Labor', path: 'labor', icon: Users },
    { label: 'Equipment', path: 'equipment', icon: Cpu },
    { label: 'Products', path: 'products', icon: Package },
    { label: 'Run Model', path: 'run', icon: Play },
    { label: 'What-If Studio', path: 'whatif', icon: FlaskConical },
  ];

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Products"
          value={model.products.length}
          icon={Package}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Equipment Groups"
          value={model.equipment.length}
          icon={Cpu}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Labor Groups"
          value={model.labor.length}
          icon={Users}
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="What-If Scenarios"
          value={modelScenarios.length}
          icon={FlaskConical}
          iconClassName="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Quick Access">
          {quickLinks.map((l) => (
            <Button
              key={l.path}
              variant="ghost"
              className="w-full justify-between h-10 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => router.push(PATH_TO_ROUTE[l.path] ?? '/dashboard/overview')}
            >
              <span className="flex items-center gap-2 text-sm">
                <l.icon className="h-4 w-4 text-slate-500" /> {l.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          ))}
        </SectionCard>

        <SectionCard title="Model Info">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Time Units</span>
              <span className="font-mono text-slate-900">{model.general.ops_time_unit} → {model.general.mct_time_unit} → {model.general.prod_period_unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Utilization Limit</span>
              <span className="font-mono text-slate-900">{model.general.util_limit}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Conv 1</span>
              <span className="font-mono text-slate-900">{model.general.conv1} {model.general.ops_time_unit}/{model.general.mct_time_unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Conv 2</span>
              <span className="font-mono text-slate-900">{model.general.conv2} {model.general.mct_time_unit}/{model.general.prod_period_unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Author</span>
              <span className="text-slate-900">{model.general.author || '—'}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-500">Tags</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {model.tags.length ? model.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs border border-slate-200 bg-slate-50 text-slate-700">{t}</Badge>
                )) : '—'}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}