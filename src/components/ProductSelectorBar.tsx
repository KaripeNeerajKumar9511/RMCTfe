import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import type { Product, Operation } from '@/stores/modelStore';

interface ProductSelectorBarProps {
  products: Product[];
  operations: Operation[];
  selectedProductId: string;
  onSelect: (id: string) => void;
  statusPill?: React.ReactNode;
}

export function ProductSelectorBar({ products, operations, selectedProductId, onSelect, statusPill }: ProductSelectorBarProps) {
  const [open, setOpen] = useState(false);
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedIdx = products.findIndex(p => p.id === selectedProductId);

  const opCount = (pid: string) => operations.filter(o => o.product_id === pid && o.op_name !== 'DOCK' && o.op_name !== 'STOCK' && o.op_name !== 'SCRAP').length;

  const goPrev = () => {
    if (products.length === 0) return;
    const idx = selectedIdx <= 0 ? products.length - 1 : selectedIdx - 1;
    onSelect(products[idx].id);
  };

  const goNext = () => {
    if (products.length === 0) return;
    const idx = selectedIdx >= products.length - 1 ? 0 : selectedIdx + 1;
    onSelect(products[idx].id);
  };

  return (
    <div className="flex items-center gap-3 h-12 px-4 rounded-lg border border-slate-200 bg-white shadow-sm">
      <span className="text-[13px] text-slate-600 shrink-0">Product:</span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-64 justify-between h-8 rounded-md border-slate-200 bg-white font-mono text-xs text-slate-900 hover:bg-slate-50"
          >
            {selectedProduct ? (
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{selectedProduct.name}</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1 shrink-0 bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {opCount(selectedProduct.id)} ops
                </Badge>
              </span>
            ) : (
              'Select product…'
            )}
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[320px] p-0 border border-slate-200 bg-white shadow-lg rounded-md"
          align="start"
        >
          <div className="border-b border-slate-100 px-3 py-2 flex items-center justify-between bg-slate-50/80">
            <span className="text-[11px] text-slate-500">
              Operations for{' '}
              <span className="font-mono font-semibold text-slate-900">
                {selectedProduct ? selectedProduct.name : '—'}
              </span>
            </span>
            {selectedProduct && (
              <span className="text-[11px] font-mono text-slate-500">
                {opCount(selectedProduct.id)} ops
              </span>
            )}
          </div>
          <Command>
            <CommandInput
              placeholder="Search products…"
              className="h-9 border-0 border-b border-slate-100 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
            />
            <CommandList className="max-h-64 overflow-y-auto">
              <CommandEmpty className="px-3 py-2 text-xs text-slate-500">
                No products found.
              </CommandEmpty>
              {products.map(p => {
                const isSelected = p.id === selectedProductId;
                return (
                  <CommandItem
                    key={p.id}
                    value={p.name}
                    onSelect={() => {
                      onSelect(p.id);
                      setOpen(false);
                    }}
                    className={`font-mono text-xs flex items-center justify-between px-3 py-1.5 cursor-pointer data-[highlighted]:bg-sky-50 data-[highlighted]:text-slate-900 ${
                      isSelected ? 'bg-sky-50 text-slate-900' : ''
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="ml-2 flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                      <span className="font-mono">{opCount(p.id)}</span>
                      <span className="uppercase tracking-tight">ops</span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100"
          onClick={goPrev}
          disabled={products.length <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100"
          onClick={goNext}
          disabled={products.length <= 1}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {statusPill && <div className="ml-auto">{statusPill}</div>}
    </div>
  );
}
