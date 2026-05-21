import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import type { AdminCar } from '../../api/admin';

// Константы для отображения значений фильтров
export const FUEL_LABELS: Record<string, string> = {
  petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид', gas: 'Газ',
};

export const TRANSMISSION_LABELS: Record<string, string> = {
  manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор',
};

export const BODY_LABELS: Record<string, string> = {
  sedan: 'Седан', hatchback: 'Хэтчбек', suv: 'Внедорожник', coupe: 'Купе',
  wagon: 'Универсал', minivan: 'Минивэн', pickup: 'Пикап',
};

// Типы и утилиты фильтров

export interface CarFiltersState {
  status: string;
  priceMin: string;
  priceMax: string;
  mileageMin: string;
  mileageMax: string;
  yearMin: string;
  yearMax: string;
  brands: string[];
  transmissions: string[];
  fuelTypes: string[];
  bodyTypes: string[];
}

export const EMPTY_FILTERS: CarFiltersState = {
  status: '',
  priceMin: '', priceMax: '',
  mileageMin: '', mileageMax: '',
  yearMin: '', yearMax: '',
  brands: [],
  transmissions: [],
  fuelTypes: [],
  bodyTypes: [],
};

export function hasActiveFilters(f: CarFiltersState): boolean {
  return !!(f.status || f.priceMin || f.priceMax || f.mileageMin || f.mileageMax ||
    f.yearMin || f.yearMax || f.brands.length || f.transmissions.length ||
    f.fuelTypes.length || f.bodyTypes.length);
}

export function applyFilters(cars: AdminCar[], f: CarFiltersState): AdminCar[] {
  return cars.filter(car => {
    if (f.status && car.status !== f.status) return false;
    
    const price = Number(car.price) || 0;
    if (f.priceMin && price < Number(f.priceMin)) return false;
    if (f.priceMax && price > Number(f.priceMax)) return false;
    
    if (f.mileageMin && car.mileage < Number(f.mileageMin)) return false;
    if (f.mileageMax && car.mileage > Number(f.mileageMax)) return false;
    
    if (f.yearMin && car.year < Number(f.yearMin)) return false;
    if (f.yearMax && car.year > Number(f.yearMax)) return false;
    
    if (f.brands.length && !f.brands.includes(car.brand)) return false;
    if (f.transmissions.length && (!car.transmission || !f.transmissions.includes(car.transmission))) return false;
    if (f.fuelTypes.length && (!car.fuel_type || !f.fuelTypes.includes(car.fuel_type))) return false;
    if (f.bodyTypes.length && (!car.body_type || !f.bodyTypes.includes(car.body_type))) return false;
    
    return true;
  });
}

// Компонент: MultiSelectDropdown

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}

export function MultiSelectDropdown({ 
  label, 
  options, 
  selected, 
  onToggle, 
  onClear 
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayText = selected.length > 0
    ? selected.map(v => options.find(o => o.value === v)?.label ?? v).join(', ')
    : 'Все';

  return (
    <div className="relative" ref={ref}>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-secondary rounded-lg text-sm text-left hover:bg-secondary/80 transition-colors ${selected.length > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}
      >
        <span className="truncate mr-2">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto py-1">
            {options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50 text-sm">
                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${selected.includes(opt.value) ? 'bg-primary border-primary' : 'border-border'}`}>
                  {selected.includes(opt.value) && <Check className="w-3 h-3 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={selected.includes(opt.value)} onChange={() => onToggle(opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-border px-3 py-2">
              <button type="button" onClick={onClear} className="text-xs text-destructive hover:underline">Очистить</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Компонент: Карточка фильтров

interface CarFilterPanelProps {
  filters: CarFiltersState;
  onChange: (f: CarFiltersState) => void;
  onReset: () => void;
  availableBrands: string[];
  CAR_STATUS_LABELS: Record<string, string>;
  CAR_STATUS_COLORS: Record<string, string>;
}

export function CarFilterPanel({ 
  filters, 
  onChange, 
  onReset, 
  availableBrands,
  CAR_STATUS_LABELS,
  CAR_STATUS_COLORS,
}: CarFilterPanelProps) {
  const set = (patch: Partial<CarFiltersState>) => onChange({ ...filters, ...patch });
  const toggleArr = (key: keyof CarFiltersState, val: string) => {
    const arr = filters[key] as string[];
    set({ [key]: arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val] });
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4" /> Фильтры
        </p>
        {hasActiveFilters(filters) && (
          <button onClick={onReset} className="text-xs text-destructive hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Сбросить
          </button>
        )}
      </div>

      {/* Статус */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Статус</p>
        <div className="flex flex-wrap gap-1.5">
          {[['', 'Все'], ...Object.entries(CAR_STATUS_LABELS)].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => set({ status: v })}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filters.status === v
                  ? v ? CAR_STATUS_COLORS[v] + ' ring-2 ring-offset-1 ring-primary/20' : 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {l as string}
            </button>
          ))}
        </div>
      </div>

      {/* Цена */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Цена, ₽</p>
        <div className="flex gap-2">
          <input
            type="text" inputMode="numeric" placeholder="От"
            value={filters.priceMin}
            onChange={e => set({ priceMin: e.target.value.replace(/\D/g, '') })}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text" inputMode="numeric" placeholder="До"
            value={filters.priceMax}
            onChange={e => set({ priceMax: e.target.value.replace(/\D/g, '') })}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Пробег */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Пробег, км</p>
        <div className="flex gap-2">
          <input
            type="text" inputMode="numeric" placeholder="От"
            value={filters.mileageMin}
            onChange={e => set({ mileageMin: e.target.value.replace(/\D/g, '') })}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text" inputMode="numeric" placeholder="До"
            value={filters.mileageMax}
            onChange={e => set({ mileageMax: e.target.value.replace(/\D/g, '') })}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Год */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Год выпуска</p>
        <div className="flex gap-2">
          <input
            type="text" inputMode="numeric" placeholder="От"
            value={filters.yearMin}
            onChange={e => set({ yearMin: e.target.value.replace(/\D/g, '') })}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text" inputMode="numeric" placeholder="До"
            value={filters.yearMax}
            onChange={e => set({ yearMax: e.target.value.replace(/\D/g, '') })}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Марка */}
      {availableBrands.length > 0 && (
        <MultiSelectDropdown
          label="Марка"
          options={availableBrands.map(b => ({ value: b, label: b }))}
          selected={filters.brands}
          onToggle={v => toggleArr('brands', v)}
          onClear={() => set({ brands: [] })}
        />
      )}

      {/* КПП */}
      <MultiSelectDropdown
        label="Коробка передач"
        options={Object.entries(TRANSMISSION_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        selected={filters.transmissions}
        onToggle={v => toggleArr('transmissions', v)}
        onClear={() => set({ transmissions: [] })}
      />

      {/* Топливо */}
      <MultiSelectDropdown
        label="Тип топлива"
        options={Object.entries(FUEL_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        selected={filters.fuelTypes}
        onToggle={v => toggleArr('fuelTypes', v)}
        onClear={() => set({ fuelTypes: [] })}
      />

      {/* Кузов */}
      <MultiSelectDropdown
        label="Тип кузова"
        options={Object.entries(BODY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        selected={filters.bodyTypes}
        onToggle={v => toggleArr('bodyTypes', v)}
        onClear={() => set({ bodyTypes: [] })}
      />
    </div>
  );
}