import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Car, Users, FileText, BarChart3, Plus, Edit, Trash2,
  Check, X, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  MessageSquare, DollarSign, AlertCircle, Eye, Search, Upload,
  SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router';
import {
  adminApi,
  type AdminUser, type AdminCar, type AdminCarOffer,
  type AdminMessage, type DashboardStats,
  type UserCreate, type UserRole, type UserStatus,
  type CarOfferStatus, type MessageStatus, type CarStatus,
  type AdminListingFilters,
} from '../api/admin';
import { catalogApi } from '../api/catalog';
import type { CatalogMark, CatalogModel, CatalogGeneration, CatalogConfiguration, CatalogModification } from '../api/catalog';
import { formatCatalogId } from '../api/cars';

type TabType = 'stats' | 'cars' | 'offers' | 'messages' | 'users';

function markLabel(m: CatalogMark) { return m.name ?? m.cyrillic_name ?? formatCatalogId(m.id); }
function modelLabel(m: CatalogModel) { return m.name ?? formatCatalogId(m.id); }

// Helpers

const inputCls = "w-full px-3 py-2 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary border border-border focus:border-primary transition-colors";
const selectCls = "w-full px-3 py-2 bg-secondary text-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary border border-border focus:border-primary transition-colors";

function formatPrice(p: string | number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(p));
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU');
}
function formatMileage(m: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(m)} км`;
}

const CAR_STATUS_LABELS: Record<string, string> = {
  available: 'Доступен', reserved: 'Зарезервирован', sold: 'Продан', inactive: 'Неактивен',
};
const CAR_STATUS_COLORS: Record<string, string> = {
  available: 'bg-accent/10 text-accent',
  reserved: 'bg-primary/10 text-primary',
  sold: 'bg-muted text-muted-foreground',
  inactive: 'bg-secondary text-muted-foreground',
};
const OFFER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  approved: 'bg-accent/10 text-accent',
  rejected: 'bg-destructive/10 text-destructive',
};
const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении', approved: 'Одобрена', rejected: 'Отклонена',
};
const MSG_STATUS_LABELS: Record<string, string> = {
  // ticket statuses
  open: 'Открыт', in_progress: 'В работе', resolved: 'Решено', closed: 'Закрыт',
  // legacy (kept for compat)
  new: 'Новое',
};
const MSG_STATUS_COLORS: Record<string, string> = {
  open: 'bg-accent/10 text-accent',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  closed: 'bg-destructive/10 text-destructive',
  new: 'bg-accent/10 text-accent',
};
const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор', manager: 'Менеджер', support: 'Поддержка', user: 'Пользователь',
};
const USER_STATUS_LABELS: Record<string, string> = {
  active: 'Активен', inactive: 'Неактивен', banned: 'Заблокирован',
};
const USER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-accent/10 text-accent',
  inactive: 'bg-muted text-muted-foreground',
  banned: 'bg-destructive/10 text-destructive',
};
const FUEL_LABELS: Record<string, string> = {
  petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид', gas: 'Газ',
};
const TRANSMISSION_LABELS: Record<string, string> = {
  manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор',
};
const BODY_LABELS: Record<string, string> = {
  sedan: 'Седан', hatchback: 'Хэтчбек', suv: 'Внедорожник', coupe: 'Купе',
  wagon: 'Универсал', minivan: 'Минивэн', pickup: 'Пикап',
};

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
}

// Pagination

function Pagination({ skip, limit, count, onChange }: {
  skip: number; limit: number; count: number; onChange: (skip: number) => void;
}) {
  const page = Math.floor(skip / limit) + 1;
  const total = Math.ceil(count / limit);
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">{skip + 1}–{Math.min(skip + limit, count)} из {count}</p>
      <div className="flex gap-2">
        <button onClick={() => onChange(skip - limit)} disabled={skip === 0}
          className="p-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 text-sm text-foreground">{page} / {total}</span>
        <button onClick={() => onChange(skip + limit)} disabled={skip + limit >= count}
          className="p-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Car Filters

interface CarFiltersState {
  status: string; priceMin: string; priceMax: string;
  mileageMin: string; mileageMax: string; yearMin: string; yearMax: string;
  brands: string[]; models: string[]; transmissions: string[]; fuelTypes: string[]; bodyTypes: string[];
  selectedGenIds: string[]; selectedConfIds: string[]; selectedModifIds: string[];
}
const EMPTY_FILTERS: CarFiltersState = {
  status: '', priceMin: '', priceMax: '', mileageMin: '', mileageMax: '',
  yearMin: '', yearMax: '', brands: [], models: [], transmissions: [], fuelTypes: [], bodyTypes: [],
  selectedGenIds: [], selectedConfIds: [], selectedModifIds: [],
};

function hasActiveFilters(f: CarFiltersState): boolean {
  return !!(f.status || f.priceMin || f.priceMax || f.mileageMin || f.mileageMax ||
    f.yearMin || f.yearMax || f.brands.length || f.models.length || f.transmissions.length ||
    f.fuelTypes.length || f.bodyTypes.length || f.selectedGenIds.length || f.selectedConfIds.length || f.selectedModifIds.length);
}

function applyFilters(
  cars: AdminCar[], f: CarFiltersState, search: string,
  availableGens: CatalogGeneration[] = [], availableConfs: CatalogConfiguration[] = [],
): AdminCar[] {
  return cars.filter(car => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!car.brand.toLowerCase().includes(q) && !car.model.toLowerCase().includes(q) &&
        !(car.vin && car.vin.toLowerCase().includes(q))) return false;
    }
    if (f.status && car.status !== f.status) return false;
    const price = Number(car.price);
    if (f.priceMin && price < Number(f.priceMin)) return false;
    if (f.priceMax && price > Number(f.priceMax)) return false;
    if (f.mileageMin && car.mileage < Number(f.mileageMin)) return false;
    if (f.mileageMax && car.mileage > Number(f.mileageMax)) return false;
    if (f.yearMin && car.year < Number(f.yearMin)) return false;
    if (f.yearMax && car.year > Number(f.yearMax)) return false;
    if (f.brands.length && !f.brands.includes(car.brand)) return false;
    if (f.models.length && !f.models.includes(car.model)) return false;
    if (f.transmissions.length && (!car.transmission || !f.transmissions.includes(car.transmission))) return false;
    if (f.fuelTypes.length && (!car.fuel_type || !f.fuelTypes.includes(car.fuel_type))) return false;
    if (f.bodyTypes.length && (!car.body_type || !f.bodyTypes.includes(car.body_type))) return false;
    if (f.selectedGenIds.length) {
      const matched = f.selectedGenIds.some(genId => {
        const gen = availableGens.find(g => g.id === genId);
        if (!gen || (!gen.year_from && !gen.year_to)) return true;
        return (!gen.year_from || car.year >= gen.year_from) && (!gen.year_to || car.year <= gen.year_to);
      });
      if (!matched) return false;
    }
    if (f.selectedConfIds.length) {
      const bodyTypes = f.selectedConfIds
        .map(id => availableConfs.find(c => c.id === id)?.body_type)
        .filter(Boolean) as string[];
      if (bodyTypes.length > 0 && (!car.body_type || !bodyTypes.includes(car.body_type))) return false;
    }
    return true;
  });
}

function MultiSelectDropdown({ label, options, selected, onToggle, onClear }: {
  label: string; options: { value: string; label: string }[];
  selected: string[]; onToggle: (v: string) => void; onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const displayText = selected.length > 0
    ? selected.map(v => options.find(o => o.value === v)?.label ?? v).join(', ')
    : 'Все';
  return (
    <div className="relative" ref={ref}>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-secondary rounded-lg text-sm text-left hover:bg-secondary/80 transition-colors border border-border ${selected.length > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        <span className="truncate mr-2">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto py-1">
            {options.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground text-center">Нет вариантов</p>}
            {options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50 text-sm text-foreground">
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

function CarFilterPanel({ filters, onChange, onReset, availableBrands, brandsLoading,
  availableModels, modelsLoading, availableGens, availableConfs, availableModifs,
}: {
  filters: CarFiltersState; onChange: (f: CarFiltersState) => void;
  onReset: () => void; availableBrands: string[]; brandsLoading: boolean;
  availableModels: CatalogModel[]; modelsLoading: boolean;
  availableGens: CatalogGeneration[]; availableConfs: CatalogConfiguration[]; availableModifs: CatalogModification[];
}) {
  const set = (patch: Partial<CarFiltersState>) => onChange({ ...filters, ...patch });
  const toggleArr = (key: keyof CarFiltersState, val: string) => {
    const arr = filters[key] as string[];
    set({ [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  };
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4" /> Фильтры
        </p>
        {hasActiveFilters(filters) && (
          <button onClick={onReset} className="text-xs text-destructive hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Сбросить
          </button>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Статус</p>
        <div className="flex flex-wrap gap-1.5">
          {[['', 'Все'], ...Object.entries(CAR_STATUS_LABELS)].map(([v, l]) => (
            <button key={v} type="button" onClick={() => set({ status: v })}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${filters.status === v
                ? v ? CAR_STATUS_COLORS[v] + ' ring-2 ring-offset-1 ring-primary/20' : 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Цена, ₽</p>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" placeholder="От" value={filters.priceMin}
            onChange={e => set({ priceMin: e.target.value.replace(/\D/g, '') })} className={inputCls} />
          <input type="text" inputMode="numeric" placeholder="До" value={filters.priceMax}
            onChange={e => set({ priceMax: e.target.value.replace(/\D/g, '') })} className={inputCls} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Пробег, км</p>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" placeholder="От" value={filters.mileageMin}
            onChange={e => set({ mileageMin: e.target.value.replace(/\D/g, '') })} className={inputCls} />
          <input type="text" inputMode="numeric" placeholder="До" value={filters.mileageMax}
            onChange={e => set({ mileageMax: e.target.value.replace(/\D/g, '') })} className={inputCls} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Год выпуска</p>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" placeholder="От" value={filters.yearMin}
            onChange={e => set({ yearMin: e.target.value.replace(/\D/g, '') })} className={inputCls} />
          <input type="text" inputMode="numeric" placeholder="До" value={filters.yearMax}
            onChange={e => set({ yearMax: e.target.value.replace(/\D/g, '') })} className={inputCls} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1">Марка</p>
        {brandsLoading ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm text-muted-foreground border border-border">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Загрузка...
          </div>
        ) : (
          <MultiSelectDropdown label="" options={availableBrands.map(b => ({ value: b, label: b }))}
            selected={filters.brands} onToggle={v => toggleArr('brands', v)}
            onClear={() => set({ brands: [], models: [], selectedGenIds: [], selectedConfIds: [], selectedModifIds: [] })} />
        )}
      </div>
      {filters.brands.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Модель</p>
          {modelsLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm text-muted-foreground border border-border">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Загрузка...
            </div>
          ) : availableModels.length > 0 ? (
            <MultiSelectDropdown label="" options={availableModels.map(m => ({ value: modelLabel(m), label: modelLabel(m) }))}
              selected={filters.models} onToggle={v => toggleArr('models', v)}
              onClear={() => set({ models: [], selectedGenIds: [], selectedConfIds: [], selectedModifIds: [] })} />
          ) : (
            <p className="text-xs text-muted-foreground px-1">Нет моделей</p>
          )}
        </div>
      )}
      {filters.models.length === 1 && availableGens.length > 0 && (
        <MultiSelectDropdown label="Поколение"
          options={availableGens.map(g => ({ value: g.id, label: g.name ?? `${g.year_from ?? ''}–${g.year_to ?? '...'}` }))}
          selected={filters.selectedGenIds}
          onToggle={v => { const next = filters.selectedGenIds.includes(v) ? filters.selectedGenIds.filter(x => x !== v) : [...filters.selectedGenIds, v]; set({ selectedGenIds: next, selectedConfIds: [], selectedModifIds: [] }); }}
          onClear={() => set({ selectedGenIds: [], selectedConfIds: [], selectedModifIds: [] })} />
      )}
      {filters.selectedGenIds.length > 0 && availableConfs.length > 0 && (
        <MultiSelectDropdown label="Комплектация"
          options={availableConfs.map(c => ({ value: c.id, label: c.name ?? c.id }))}
          selected={filters.selectedConfIds}
          onToggle={v => { const next = filters.selectedConfIds.includes(v) ? filters.selectedConfIds.filter(x => x !== v) : [...filters.selectedConfIds, v]; set({ selectedConfIds: next, selectedModifIds: [] }); }}
          onClear={() => set({ selectedConfIds: [], selectedModifIds: [] })} />
      )}
      {filters.selectedConfIds.length > 0 && availableModifs.length > 0 && (
        <MultiSelectDropdown label="Модификация"
          options={availableModifs.map(m => ({ value: m.id, label: m.name ?? m.group_name ?? m.id }))}
          selected={filters.selectedModifIds}
          onToggle={v => { const next = filters.selectedModifIds.includes(v) ? filters.selectedModifIds.filter(x => x !== v) : [...filters.selectedModifIds, v]; set({ selectedModifIds: next }); }}
          onClear={() => set({ selectedModifIds: [] })} />
      )}
      <MultiSelectDropdown label="Коробка передач"
        options={Object.entries(TRANSMISSION_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        selected={filters.transmissions} onToggle={v => toggleArr('transmissions', v)} onClear={() => set({ transmissions: [] })} />
      <MultiSelectDropdown label="Тип топлива"
        options={Object.entries(FUEL_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        selected={filters.fuelTypes} onToggle={v => toggleArr('fuelTypes', v)} onClear={() => set({ fuelTypes: [] })} />
      <MultiSelectDropdown label="Тип кузова"
        options={Object.entries(BODY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        selected={filters.bodyTypes} onToggle={v => toggleArr('bodyTypes', v)} onClear={() => set({ bodyTypes: [] })} />
    </div>
  );
}

// StatsTab

function StatsTab({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  if (loading) return <LoadingSpinner />;
  if (!stats) return <ErrorState message="Не удалось загрузить статистику" />;
  const cards = [
    { label: 'Всего объявлений', value: stats.active_listings + stats.reserved_listings + stats.sold_listings, sub: `${stats.active_listings} активных`, icon: Car, color: 'bg-primary/10 text-primary', glow: 'hover:shadow-primary/25' },
    { label: 'Продано', value: stats.sold_listings, sub: `${stats.reserved_listings} зарезервировано`, icon: DollarSign, color: 'bg-accent/10 text-accent', glow: 'hover:shadow-accent/25' },
    { label: 'Всего резерваций', value: stats.total_deals, sub: `${stats.completed_deals} завершено`, icon: BarChart3, color: 'bg-purple-500/10 text-purple-500', glow: 'hover:shadow-purple-500/25' },
    { label: 'Активных резерваций', value: stats.active_reservations, sub: `${stats.pending_deals} в расчёте`, icon: DollarSign, color: 'bg-green-500/10 text-green-500', glow: 'hover:shadow-green-500/25' },
    { label: 'Пользователей', value: stats.total_users, sub: 'Всего в базе', icon: Users, color: 'bg-orange-500/10 text-orange-500', glow: 'hover:shadow-orange-500/25' },
    { label: 'Открытых тикетов', value: stats.open_tickets, sub: 'Ожидают ответа', icon: MessageSquare, color: 'bg-destructive/10 text-destructive', glow: 'hover:shadow-destructive/25' },
    { label: 'В расчёте', value: stats.pending_deals, sub: 'Сделки на завершении', icon: FileText, color: 'bg-yellow-500/10 text-yellow-500', glow: 'hover:shadow-yellow-500/25' },
    { label: 'Ожидают модерации', value: stats.pending_offers, sub: 'Новых объявлений', icon: Eye, color: 'bg-cyan-500/10 text-cyan-500', glow: 'hover:shadow-cyan-500/25' },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Статистика</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color, glow }) => (
          <div key={label} className={`bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${glow}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// CarTableRow

function CarTableRow({ car, onEdit, onDelete, onStatusChange, onRowClick }: {
  car: AdminCar; onEdit: (car: AdminCar) => void;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onRowClick: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-secondary/50 transition-colors cursor-pointer"
      onClick={e => { if ((e.target as HTMLElement).closest('button, select')) return; onRowClick(car.id); }}>
      <td className="px-4 py-3">
        <p className="font-semibold text-foreground">{car.brand} {car.model}</p>
        {car.color && <p className="text-xs text-muted-foreground">{car.color}</p>}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{car.year}</td>
      <td className="px-4 py-3 font-medium text-foreground">{formatPrice(car.price)}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatMileage(car.mileage)}</td>
      <td className="px-4 py-3">
        <select value={car.status}
          onChange={e => { e.stopPropagation(); onStatusChange(car.id, e.target.value); }}
          onClick={e => e.stopPropagation()}
          className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${CAR_STATUS_COLORS[car.status]}`}>
          {Object.entries(CAR_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(car)} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
            <Edit className="w-4 h-4 text-primary" />
          </button>
          <button onClick={() => onDelete(car.id, `${car.brand} ${car.model}`)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// CarsTab

const ADMIN_PAGE_SIZE = 20;

function CarsTab() {
  const navigate = useNavigate();

  // Catalog cascade state
  const [marks, setMarks] = useState<CatalogMark[]>([]);
  const [availableModels, setAvailableModels] = useState<CatalogModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [availableGens, setAvailableGens] = useState<CatalogGeneration[]>([]);
  const [availableConfs, setAvailableConfs] = useState<CatalogConfiguration[]>([]);
  const [availableModifs, setAvailableModifs] = useState<CatalogModification[]>([]);

  // Filters & search
  const [filters, setFilters] = useState<CarFiltersState>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Server data
  const [allCars, setAllCars] = useState<AdminCar[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editCar, setEditCar] = useState<AdminCar | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const emptyForm = { brand: '', model: '', year: '', price: '', mileage: '0', color: '', fuel_type: '', transmission: '', body_type: '', engine_volume: '', engine_power: '', description: '', vin: '', viewing_days: [] as string[], viewing_time_from: '09:00', viewing_time_to: '20:00', viewing_address: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Load marks from catalog
  useEffect(() => { catalogApi.searchMarks('').then(setMarks).catch(() => {}); }, []);

  // Cascade: brands → models
  useEffect(() => {
    if (filters.brands.length === 0) { setAvailableModels([]); return; }
    const ids = filters.brands.map(name => marks.find(m => markLabel(m) === name)?.id).filter(Boolean) as string[];
    if (ids.length === 0) return;
    setModelsLoading(true);
    Promise.all(ids.map(id => catalogApi.getModels(id)))
      .then(results => setAvailableModels(results.flat()))
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.brands, marks]);

  // Cascade: model → generations
  useEffect(() => {
    setAvailableGens([]); setAvailableConfs([]); setAvailableModifs([]);
    if (filters.models.length !== 1) return;
    const modelId = availableModels.find(m => modelLabel(m) === filters.models[0])?.id;
    if (!modelId) return;
    catalogApi.getGenerations(modelId).then(setAvailableGens).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.models, availableModels]);

  // Cascade: selectedGenIds → configurations (load for all selected gens, deduplicate)
  useEffect(() => {
    setAvailableConfs([]); setAvailableModifs([]);
    if (filters.selectedGenIds.length === 0) return;
    Promise.all(filters.selectedGenIds.map(id => catalogApi.getConfigurations(id)))
      .then(results => {
        const seen = new Set<string>();
        const unique = results.flat().filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
        setAvailableConfs(unique);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters.selectedGenIds)]);

  // Cascade: selectedConfIds → modifications (load for all selected confs, deduplicate)
  useEffect(() => {
    setAvailableModifs([]);
    if (filters.selectedConfIds.length === 0) return;
    Promise.all(filters.selectedConfIds.map(id => catalogApi.getModifications(id)))
      .then(results => {
        const seen = new Set<string>();
        const unique = results.flat().filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
        setAvailableModifs(unique);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters.selectedConfIds)]);

  // Build server-side filters (params supported by /listings)
  const serverFilters = useMemo((): AdminListingFilters => {
    const f: AdminListingFilters = { sort: 'newest', limit: ADMIN_PAGE_SIZE };
    if (filters.priceMin) f.price_min = Number(filters.priceMin);
    if (filters.priceMax) f.price_max = Number(filters.priceMax);
    if (filters.yearMin) f.year_min = Number(filters.yearMin);
    if (filters.yearMax) f.year_max = Number(filters.yearMax);
    if (filters.fuelTypes.length === 1) f.engine_type = filters.fuelTypes[0];
    if (filters.bodyTypes.length === 1) f.body_type = filters.bodyTypes[0];
    if (filters.brands.length === 1) {
      const mark = marks.find(m => markLabel(m) === filters.brands[0]);
      if (mark) f.mark_id = mark.id;
    }
    if (filters.models.length === 1) {
      const model = availableModels.find(m => modelLabel(m) === filters.models[0]);
      if (model) f.model_id = model.id;
    }
    return f;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.priceMin, filters.priceMax, filters.yearMin, filters.yearMax,
      filters.fuelTypes, filters.bodyTypes, filters.brands, filters.models, marks, availableModels]);

  // Fetch first page when server filters or refreshKey change
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setAllCars([]); setNextCursor(null); setHasMore(false);
    adminApi.getCars(serverFilters)
      .then(res => {
        if (cancelled) return;
        setAllCars(res.data);
        setNextCursor(res.next_cursor);
        setHasMore(res.next_cursor !== null);
      })
      .catch(() => { if (!cancelled) toast.error('Ошибка загрузки автомобилей'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serverFilters), refreshKey]);

  // Load more pages (cursor-based)
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);
    adminApi.getCars({ ...serverFilters, cursor: nextCursor })
      .then(res => {
        setAllCars(prev => [...prev, ...res.data]);
        setNextCursor(res.next_cursor);
        setHasMore(res.next_cursor !== null);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, nextCursor, JSON.stringify(serverFilters)]);

  // IntersectionObserver for auto-load
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  useEffect(() => { return () => { previews.forEach(url => URL.revokeObjectURL(url)); }; }, [previews]);

  // Client-side filters applied on top of server results
  const filteredCars = useMemo(
    () => applyFilters(allCars, filters, debouncedSearch, availableGens, availableConfs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCars, filters, debouncedSearch, availableGens, availableConfs]
  );

  const availableBrands = useMemo(() => marks.map(m => markLabel(m)).sort(), [marks]);
  const isLoading = loading && allCars.length === 0;
  const handleReload = () => setRefreshKey(k => k + 1);

  const activeFiltersCount = [
    filters.status, filters.priceMin, filters.priceMax,
    filters.mileageMin, filters.mileageMax, filters.yearMin, filters.yearMax,
    ...filters.selectedGenIds, ...filters.selectedConfIds, ...filters.selectedModifIds,
    ...filters.brands, ...filters.models, ...filters.transmissions, ...filters.fuelTypes, ...filters.bodyTypes,
  ].filter(Boolean).length;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const nf = Array.from(e.target.files);
    setSelectedFiles(p => [...p, ...nf]);
    setPreviews(p => [...p, ...nf.map(f => URL.createObjectURL(f))]);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nf = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setSelectedFiles(p => [...p, ...nf]);
    setPreviews(p => [...p, ...nf.map(f => URL.createObjectURL(f))]);
  };
  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setSelectedFiles(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };
  const clearFiles = () => { previews.forEach(url => URL.revokeObjectURL(url)); setSelectedFiles([]); setPreviews([]); };

  const openCreate = () => { setEditCar(null); setForm(emptyForm); clearFiles(); setShowForm(true); };
  const openEdit = (car: AdminCar) => {
    setEditCar(car);
    const c = car as AdminCar & { viewing_days?: string[]; viewing_time_from?: string; viewing_time_to?: string; viewing_address?: string };
    setForm({ brand: car.brand, model: car.model, year: String(car.year), price: String(car.price), mileage: String(car.mileage), color: car.color ?? '', fuel_type: car.fuel_type ?? '', transmission: car.transmission ?? '', body_type: car.body_type ?? '', engine_volume: car.engine_volume ?? '', engine_power: String(car.engine_power ?? ''), description: car.description ?? '', vin: car.vin ?? '', viewing_days: c.viewing_days ?? [], viewing_time_from: c.viewing_time_from ?? '09:00', viewing_time_to: c.viewing_time_to ?? '20:00', viewing_address: c.viewing_address ?? '' });
    clearFiles(); setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.error('Создание/редактирование авто недоступно: в новой системе пользователи создают объявления самостоятельно');
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await adminApi.deleteListing(deleteModal.id);
      toast.success('Объявление удалено');
      setDeleteModal(null);
      handleReload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (_id: string, _status: string) => {
    toast.error('Изменение статуса недоступно через панель администратора');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex gap-4">
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <CarFilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)}
          availableBrands={availableBrands} brandsLoading={marks.length === 0}
          availableModels={availableModels} modelsLoading={modelsLoading}
          availableGens={availableGens} availableConfs={availableConfs} availableModifs={availableModifs} />
      </aside>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-semibold text-foreground">
              Автомобили <span className="text-muted-foreground text-lg font-normal">
                ({loading ? '…' : `${filteredCars.length}${hasMore ? '+' : ''}`})
              </span>
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFiltersOpen(!filtersOpen)}
                className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${activeFiltersCount > 0 ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary text-foreground'}`}>
                <SlidersHorizontal className="w-4 h-4" /> Фильтры
                {activeFiltersCount > 0 && <span className="bg-white/20 text-xs px-1.5 rounded-full">{activeFiltersCount}</span>}
              </button>
              {hasActiveFilters(filters) && (
                <button onClick={() => setFilters(EMPTY_FILTERS)} className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors">
                  <X className="w-4 h-4" /> Сбросить
                </button>
              )}
              <button onClick={handleReload} disabled={loading} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 text-foreground" title="Обновить">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по марке, модели, VIN..."
              className="w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {(hasActiveFilters(filters) || searchQuery) && (
            <div className="flex flex-wrap gap-1.5">
              {searchQuery && (
                <span className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  Поиск: «{searchQuery}» <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.status && (
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${CAR_STATUS_COLORS[filters.status]}`}>
                  {CAR_STATUS_LABELS[filters.status]} <button onClick={() => setFilters(f => ({ ...f, status: '' }))}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(filters.priceMin || filters.priceMax) && (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  Цена: {filters.priceMin || '0'} – {filters.priceMax || '∞'} ₽
                  <button onClick={() => setFilters(f => ({ ...f, priceMin: '', priceMax: '' }))}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(filters.mileageMin || filters.mileageMax) && (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  Пробег: {filters.mileageMin || '0'} – {filters.mileageMax || '∞'} км
                  <button onClick={() => setFilters(f => ({ ...f, mileageMin: '', mileageMax: '' }))}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(filters.yearMin || filters.yearMax) && (
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  Год: {filters.yearMin || '–'} – {filters.yearMax || '–'}
                  <button onClick={() => setFilters(f => ({ ...f, yearMin: '', yearMax: '' }))}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.brands.map(b => (
                <span key={b} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {b} <button onClick={() => setFilters(f => ({ ...f, brands: f.brands.filter(x => x !== b), models: [], selectedGenIds: [], selectedConfIds: [], selectedModifIds: [] }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.models.map(m => (
                <span key={m} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {m} <button onClick={() => setFilters(f => ({ ...f, models: f.models.filter(x => x !== m), selectedGenIds: [], selectedConfIds: [], selectedModifIds: [] }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.selectedGenIds.map(id => (
                <span key={id} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {availableGens.find(g => g.id === id)?.name ?? 'Поколение'}
                  <button onClick={() => setFilters(f => ({ ...f, selectedGenIds: f.selectedGenIds.filter(x => x !== id), selectedConfIds: [], selectedModifIds: [] }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.selectedConfIds.map(id => (
                <span key={id} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {availableConfs.find(c => c.id === id)?.name ?? 'Комплектация'}
                  <button onClick={() => setFilters(f => ({ ...f, selectedConfIds: f.selectedConfIds.filter(x => x !== id), selectedModifIds: [] }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.selectedModifIds.map(id => (
                <span key={id} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {availableModifs.find(m => m.id === id)?.name ?? 'Модификация'}
                  <button onClick={() => setFilters(f => ({ ...f, selectedModifIds: f.selectedModifIds.filter(x => x !== id) }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.transmissions.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {TRANSMISSION_LABELS[t]} <button onClick={() => setFilters(f => ({ ...f, transmissions: f.transmissions.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.fuelTypes.map(ft => (
                <span key={ft} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {FUEL_LABELS[ft]} <button onClick={() => setFilters(f => ({ ...f, fuelTypes: f.fuelTypes.filter(x => x !== ft) }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {filters.bodyTypes.map(bt => (
                <span key={bt} className="flex items-center gap-1 text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">
                  {BODY_LABELS[bt]} <button onClick={() => setFilters(f => ({ ...f, bodyTypes: f.bodyTypes.filter(x => x !== bt) }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {loading && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Загрузка...
                </span>
              )}
            </div>
          )}
        </div>

        {filtersOpen && (
          <div className="lg:hidden">
            <CarFilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters(EMPTY_FILTERS)}
              availableBrands={availableBrands} brandsLoading={marks.length === 0}
              availableModels={availableModels} modelsLoading={modelsLoading}
              availableGens={availableGens} availableConfs={availableConfs} availableModifs={availableModifs} />
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>{['Автомобиль', 'Год', 'Цена', 'Пробег', 'Статус', 'Действия'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && allCars.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                ) : filteredCars.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {hasActiveFilters(filters) || searchQuery ? 'По вашему запросу ничего не найдено' : 'Список автомобилей пуст'}
                  </td></tr>
                ) : filteredCars.map((car: AdminCar) => (
                  <CarTableRow key={car.id} car={car} onEdit={openEdit} onDelete={handleDelete}
                    onStatusChange={handleStatusChange} onRowClick={id => navigate(`/car/${id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div ref={sentinelRef} className="mt-2">
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && filteredCars.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">
              Все {filteredCars.length} объявлений загружены
            </p>
          )}
        </div>
      </div>

      {deleteModal && (
        <Modal title="Подтверждение удаления" onClose={() => setDeleteModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Вы уверены, что хотите удалить объявление{' '}
              <span className="font-semibold text-foreground">{deleteModal.name}</span>?
              Это действие необратимо.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80">Отмена</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Удалить
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showForm && (
        <Modal title={editCar ? 'Редактировать авто' : 'Добавить авто'} onClose={() => setShowForm(false)} size="lg">
          <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {([['brand','Марка *','text',true],['model','Модель *','text',true],['year','Год *','number',true],['price','Цена (₽) *','number',true],['mileage','Пробег (км)','number',false],['color','Цвет','text',false],['engine_volume','Объём (л)','number',false],['engine_power','Мощность (л.с.)','number',false],['vin','VIN','text',false]] as const).map(([key, label, type, required]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</label>
                  <input type={type} required={required} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">Тип топлива</label>
                <select value={form.fuel_type} onChange={e => setForm(p => ({ ...p, fuel_type: e.target.value }))} className={selectCls}>
                  <option value="">Не указано</option>
                  {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">КПП</label>
                <select value={form.transmission} onChange={e => setForm(p => ({ ...p, transmission: e.target.value }))} className={selectCls}>
                  <option value="">Не указано</option>
                  {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">Кузов</label>
                <select value={form.body_type} onChange={e => setForm(p => ({ ...p, body_type: e.target.value }))} className={selectCls}>
                  <option value="">Не указано</option>
                  {Object.entries(BODY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Фотографии</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => document.getElementById('car-images-input')?.click()}
                onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                <input id="car-images-input" type="file" multiple accept="image/*" className="hidden" onChange={handleFilesChange} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Перетащите фото или нажмите для выбора</p>
                <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP • До 50 МБ</p>
              </div>
              {previews.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-secondary group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={clearFiles} className="text-xs text-destructive hover:underline mt-2">Очистить все ({previews.length})</button>
                </>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">Описание</label>
              <textarea value={form.description} rows={3} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls + ' resize-none'} />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Осмотр автомобиля</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-muted-foreground">Дни приёма</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day => {
                      const active = form.viewing_days.includes(day);
                      return (
                        <button key={day} type="button"
                          onClick={() => setForm(p => ({ ...p, viewing_days: active ? p.viewing_days.filter(d => d !== day) : [...p.viewing_days, day] }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'}`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground">Время с</label>
                    <input type="time" value={form.viewing_time_from} onChange={e => setForm(p => ({ ...p, viewing_time_from: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground">Время до</label>
                    <input type="time" value={form.viewing_time_to} onChange={e => setForm(p => ({ ...p, viewing_time_to: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Адрес / место осмотра</label>
                  <input type="text" placeholder="Например: г. Москва, ул. Автомобильная, д. 1" value={form.viewing_address} onChange={e => setForm(p => ({ ...p, viewing_address: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 sticky bottom-0 bg-card/95 backdrop-blur py-2 border-t border-border">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors">Отмена</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editCar ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// OffersTab

function OffersTab() {
  const [offers, setOffers] = useState<AdminCarOffer[]>([]);
  const [count, setCount] = useState(0); const [skip, setSkip] = useState(0);
  const [filterStatus, setFilterStatus] = useState<CarOfferStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState<{ id: string; brand: string; model: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; brand: string; model: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminCarOffer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (searchQuery.trim()) return;
    setLoading(true);
    try { const data = await adminApi.getOffers(filterStatus || undefined, skip); setOffers(data.data); setCount(data.count); }
    catch { toast.error('Ошибка загрузки заявок'); } finally { setLoading(false); }
  }, [skip, filterStatus, searchQuery]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    try {
      const data = await adminApi.getOffers(filterStatus || undefined, 0);
      const q = query.toLowerCase();
      setSearchResults(data.data.filter((o: AdminCarOffer) =>
        o.brand.toLowerCase().includes(q) || o.model.toLowerCase().includes(q) ||
        String(o.year).includes(q) || String(o.price).includes(q)
      ));
    } catch (err) { if ((err as Error).name !== 'AbortError') { toast.error('Ошибка поиска'); setSearchResults([]); } }
    finally { setSearchLoading(false); }
  }, [filterStatus]);

  useEffect(() => { performSearch(debouncedSearch); }, [debouncedSearch, performSearch]);
  useEffect(() => { load(); }, [load]);
  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSkip(0); };

  const handleApprove = async () => {
    if (!approveModal) return;
    setProcessing(approveModal.id);
    try { await adminApi.reviewOffer(approveModal.id, 'approved'); toast.success('Объявление опубликовано'); setApproveModal(null); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); } finally { setProcessing(null); }
  };
  const handleReject = async () => {
    if (!rejectModal) return; setProcessing(rejectModal.id);
    try { await adminApi.reviewOffer(rejectModal.id, 'rejected', rejectReason || undefined); toast.success('Заявка отклонена'); setRejectModal(null); setRejectReason(''); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); } finally { setProcessing(null); }
  };

  const isSearching = searchQuery.trim().length > 0;
  const displayedOffers = isSearching ? searchResults : offers;
  const displayedCount = isSearching ? searchResults.length : count;
  if (loading && offers.length === 0 && !isSearching) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Заявки на продажу <span className="text-muted-foreground text-lg font-normal">({displayedCount})</span></h2>
          <div className="flex gap-2">
            {filterStatus && (
              <button onClick={() => { setFilterStatus(''); setSkip(0); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" /> Сбросить
              </button>
            )}
            <button onClick={isSearching ? clearSearch : load} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground" title={isSearching ? 'Очистить поиск' : 'Обновить'}>
              {isSearching ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по марке, модели, году, цене..."
            className="w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Статус:</span>
            <button onClick={() => { setFilterStatus(''); setSkip(0); }}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterStatus ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Все
            </button>
            {(['pending', 'approved', 'rejected'] as CarOfferStatus[]).map(s => (
              <button key={s} onClick={() => { setFilterStatus(filterStatus === s ? '' : s); setSkip(0); }}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterStatus === s ? `${OFFER_STATUS_COLORS[s]} ring-2 ring-offset-1 ring-primary/20` : 'text-muted-foreground bg-secondary hover:bg-secondary/80'}`}>
                {OFFER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

      </div>
      <div className="space-y-3">
        {displayedOffers.length === 0 && !searchLoading && <EmptyTableState text={isSearching ? 'По вашему запросу ничего не найдено' : 'Заявок нет'} />}
        {displayedOffers.map(offer => {
          const primaryImg = offer.images.find((i: { is_primary: boolean }) => i.is_primary) ?? offer.images[0];
          return (
            <div key={offer.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex gap-4">
                {primaryImg && <div className="w-24 rounded-lg overflow-hidden flex-shrink-0 bg-secondary"><img src={primaryImg.thumbnail_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-foreground">{offer.brand} {offer.model} {offer.year}</h3>
                      <p className="text-sm text-muted-foreground">{formatPrice(offer.price)} • {formatMileage(offer.mileage)} • {offer.images.length} фото</p>
                      <p className="text-xs text-muted-foreground">{formatDate(offer.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${OFFER_STATUS_COLORS[offer.status]}`}>{OFFER_STATUS_LABELS[offer.status]}</span>
                  </div>
                  {offer.rejection_reason && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{offer.rejection_reason}</p>}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setApproveModal({ id: offer.id, brand: offer.brand, model: offer.model })} disabled={processing === offer.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{processing === offer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Одобрить</button>
                      <button onClick={() => setRejectModal({ id: offer.id, brand: offer.brand, model: offer.model })} disabled={processing === offer.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 disabled:opacity-50"><X className="w-3.5 h-3.5" /> Отклонить</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!isSearching && <Pagination skip={skip} limit={20} count={count} onChange={setSkip} />}
      {approveModal && (
        <Modal title="Подтверждение публикации" onClose={() => setApproveModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Вы уверены, что хотите опубликовать объявление{' '}
              <span className="font-semibold text-foreground">{approveModal.brand} {approveModal.model}</span>?
              После публикации оно появится в каталоге.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setApproveModal(null)} className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80">Отмена</button>
              <button onClick={handleApprove} disabled={!!processing} className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Опубликовать
              </button>
            </div>
          </div>
        </Modal>
      )}
      {rejectModal && (
        <Modal title={`Отклонить: ${rejectModal.brand} ${rejectModal.model}`} onClose={() => setRejectModal(null)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-semibold mb-2 text-foreground">Причина (необязательно)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} className={inputCls + ' resize-none'} /></div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80">Отмена</button>
              <button onClick={handleReject} disabled={!!processing} className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Отклонить'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// MessagesTab

function MessagesTab() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filterStatus, setFilterStatus] = useState<MessageStatus | ''>('open');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const load = useCallback(async () => {
    if (searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await adminApi.getMessages(filterStatus || undefined, skip);
      setMessages(data.data); setCount(data.count);
    } catch { toast.error('Ошибка загрузки тикетов'); }
    finally { setLoading(false); }
  }, [skip, filterStatus, searchQuery]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: MessageStatus) => {
    setProcessing(id);
    try {
      await adminApi.updateMessage(id, { status });
      toast.success('Статус обновлён');
      load();
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setProcessing(null); }
  };

  const clearSearch = () => { setSearchQuery(''); setSkip(0); };

  const filteredMessages = useMemo(() => {
    let result = filterStatus ? messages.filter(m => m.status === filterStatus) : messages;
    if (!debouncedSearch.trim()) return result;
    const q = debouncedSearch.toLowerCase();
    return result.filter(m =>
      (m.subject && m.subject.toLowerCase().includes(q)) ||
      m.body.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.toLowerCase().includes(q))
    );
  }, [messages, debouncedSearch, filterStatus]);

  const displayedMessages = filteredMessages;
  const hasActiveFilter = !!filterStatus;
  if (loading && messages.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold text-foreground">
            Тикеты <span className="text-muted-foreground text-lg font-normal">({debouncedSearch ? filteredMessages.length : count})</span>
          </h2>
          <div className="flex gap-2">
            {hasActiveFilter && (
              <button onClick={() => { setFilterStatus(''); setSkip(0); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" /> Сбросить
              </button>
            )}
            <button onClick={searchQuery ? clearSearch : load}
              className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground" title={searchQuery ? 'Очистить поиск' : 'Обновить'}>
              {searchQuery ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по теме, тексту, имени, email..."
            className="w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Статус:</span>
            <button onClick={() => { setFilterStatus(''); setSkip(0); }}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterStatus ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              Все
            </button>
            {(['open', 'in_progress', 'resolved', 'closed'] as MessageStatus[]).map(s => (
              <button key={s} onClick={() => { setFilterStatus(filterStatus === s ? '' : s); setSkip(0); }}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterStatus === s ? `${MSG_STATUS_COLORS[s]} ring-2 ring-offset-1 ring-primary/20` : 'text-muted-foreground bg-secondary hover:bg-secondary/80'}`}>
                {MSG_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

      </div>
      <div className="space-y-2">
        {displayedMessages.length === 0 && <EmptyTableState text={debouncedSearch ? 'По вашему запросу ничего не найдено' : 'Сообщений нет'} />}
        {displayedMessages.map(msg => (
          <div key={msg.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${MSG_STATUS_COLORS[msg.status]}`}>{MSG_STATUS_LABELS[msg.status]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{msg.subject ?? msg.message_type}</p>
                <p className="text-xs text-muted-foreground">{msg.name} • {msg.email} • {formatDate(msg.created_at)}</p>
              </div>
            </button>
            {expanded === msg.id && (
              <div className="px-4 pb-4 border-t border-border">
                <p className="text-sm mt-3 text-muted-foreground leading-relaxed">{msg.body}</p>
                {msg.phone && <p className="text-sm mt-2 text-foreground"><span className="font-medium">Телефон:</span> {msg.phone}</p>}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(['open', 'in_progress', 'resolved', 'closed'] as MessageStatus[]).map(s => (
                    <button key={s} onClick={() => handleStatusChange(msg.id, s)} disabled={msg.status === s || processing === msg.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${msg.status === s ? `${MSG_STATUS_COLORS[s]} cursor-default` : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                      {processing === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : MSG_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination skip={skip} limit={20} count={count} onChange={setSkip} />
    </div>
  );
}

// UsersTab

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0); const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserCreate & { status?: UserStatus }>({ full_name: '', email: '', password: '', role: 'manager' });
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchAbortRef = useRef<AbortController | null>(null);
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');

  const load = useCallback(async () => {
    if (searchQuery.trim()) return; setLoading(true);
    try {
      const data = await adminApi.getUsers(skip);
      let filtered = data.data;
      if (filterStatus) filtered = filtered.filter((u: AdminUser) => u.status === filterStatus);
      if (filterRole) filtered = filtered.filter((u: AdminUser) => u.role === filterRole);
      setUsers(filtered); setCount(filtered.length);
    } catch { toast.error('Ошибка загрузки'); } finally { setLoading(false); }
  }, [skip, searchQuery, filterStatus, filterRole]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    try {
      const data = await adminApi.getUsers(0); const q = query.toLowerCase();
      let results = data.data.filter((u: AdminUser) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.toLowerCase().includes(q)));
      if (filterStatus) results = results.filter((u: AdminUser) => u.status === filterStatus);
      if (filterRole) results = results.filter((u: AdminUser) => u.role === filterRole);
      setSearchResults(results);
    } catch (err) { if ((err as Error).name !== 'AbortError') { toast.error('Ошибка поиска'); setSearchResults([]); } }
    finally { setSearchLoading(false); }
  }, [filterStatus, filterRole]);

  useEffect(() => { performSearch(debouncedSearch); }, [debouncedSearch, performSearch]);
  useEffect(() => { load(); }, [load]);
  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSkip(0); };

  const openCreate = () => { setEditUser(null); setForm({ full_name: '', email: '', password: '', role: 'manager' }); setShowForm(true); };
  const openEdit = (u: AdminUser) => { setEditUser(u); setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, status: u.status }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editUser) {
        const body: Record<string, unknown> = { full_name: form.full_name, email: form.email, role: form.role, status: form.status };
        if (form.password) body.password = form.password;
        await adminApi.updateUser(editUser.id, body); toast.success('Обновлён');
      } else { await adminApi.createUser({ full_name: form.full_name, email: form.email, password: form.password, role: form.role }); toast.success('Создан'); }
      setShowForm(false); if (searchQuery.trim()) performSearch(searchQuery); else load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u: AdminUser) => {
    if (u.id === currentUser?.id) { toast.error('Нельзя удалить себя'); return; }
    if (!confirm(`Удалить "${u.full_name}"?`)) return;
    try { await adminApi.deleteUser(u.id); toast.success('Удалён'); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const isSearching = searchQuery.trim().length > 0;
  const hasActiveFilters = filterStatus || filterRole;
  const displayedUsers = isSearching ? searchResults : users;
  const displayedCount = isSearching ? searchResults.length : count;
  if (loading && users.length === 0 && !isSearching) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Сотрудники <span className="text-muted-foreground text-lg font-normal">({displayedCount})</span></h2>
          <div className="flex gap-2 flex-wrap">
            {hasActiveFilters && (
              <button onClick={() => { setFilterStatus(''); setFilterRole(''); setSkip(0); }} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" /> Сбросить
              </button>
            )}
            <button onClick={isSearching ? clearSearch : load} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground">
              {isSearching ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, email, телефону..."
            className="w-full pl-10 pr-10 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Статус:</span>
            <button onClick={() => setFilterStatus('')} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterStatus ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Все</button>
            {(['active', 'inactive', 'banned'] as UserStatus[]).map(s => (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterStatus === s ? `${USER_STATUS_COLORS[s]} ring-2 ring-offset-1 ring-primary/20` : 'text-muted-foreground bg-secondary hover:bg-secondary/80'}`}>
                {USER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Роль:</span>
            <button onClick={() => setFilterRole('')} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterRole ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Все</button>
            {(['admin', 'manager', 'support', 'user'] as UserRole[]).map(r => (
              <button key={r} onClick={() => setFilterRole(filterRole === r ? '' : r)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterRole === r ? 'bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary/20' : 'text-muted-foreground bg-secondary hover:bg-secondary/80'}`}>
                {USER_ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>{['Имя', 'Email', 'Роль', 'Статус', 'Дата', 'Действия'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedUsers.length === 0 && !searchLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{isSearching ? 'По вашему запросу ничего не найдено' : 'Пусто'}</td></tr>
              ) : displayedUsers.map(u => (
                <tr key={u.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3"><p className="font-semibold text-foreground">{u.full_name}</p>{u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground font-medium">{USER_ROLE_LABELS[u.role]}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${USER_STATUS_COLORS[u.status]}`}>{USER_STATUS_LABELS[u.status]}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"><Edit className="w-4 h-4 text-primary" /></button>
                      {u.id !== currentUser?.id && <button onClick={() => handleDelete(u)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {!isSearching && <Pagination skip={skip} limit={20} count={count} onChange={setSkip} />}
      {showForm && (
        <Modal title={editUser ? 'Редактировать сотрудника' : 'Добавить сотрудника'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-3">
            {([['full_name','Полное имя *','text',true],['email','Email *','email',true],['password',editUser ? 'Новый пароль (оставьте пустым)' : 'Пароль *','password',!editUser]] as const).map(([key, label, type, required]) => (
              <div key={key}><label className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</label>
                <input type={type} required={required as boolean} value={form[key as keyof typeof form] as string ?? ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
              </div>
            ))}
            <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Роль</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))} className={selectCls}>
                {Object.entries(USER_ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            {editUser && <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Статус</label>
              <select value={form.status ?? 'active'} onChange={e => setForm(p => ({ ...p, status: e.target.value as UserStatus }))} className={selectCls}>
                <option value="active">Активен</option><option value="inactive">Неактивен</option><option value="banned">Заблокирован</option>
              </select></div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary/80">Отмена</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editUser ? 'Сохранить' : 'Создать'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Shared UI

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
}
function ErrorState({ message }: { message: string }) {
  return <div className="flex flex-col items-center justify-center py-16 text-center"><AlertCircle className="w-10 h-10 text-destructive mb-3" /><p className="text-muted-foreground">{message}</p></div>;
}
function EmptyTableState({ text }: { text: string }) {
  return <div className="bg-card rounded-xl border border-border py-12 text-center"><p className="text-muted-foreground">{text}</p></div>;
}

function Modal({ title, children, onClose, size = 'md' }: { title: string; children: React.ReactNode; onClose: () => void; size?: 'md' | 'lg' }) {
  const maxW = size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-card border border-border rounded-2xl p-6 w-full ${maxW} max-h-[90vh] overflow-y-auto shadow-xl`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Main Page

export function AdminPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'stats';
  const setActiveTab = (tab: TabType) => setSearchParams({ tab }, { replace: true });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      toast.error('Доступ запрещён'); navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => toast.error('Не удалось загрузить статистику')).finally(() => setStatsLoading(false));
  }, []);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const tabs = [
    { id: 'stats' as TabType, label: 'Статистика', icon: BarChart3 },
    { id: 'cars' as TabType, label: 'Объявления', icon: Car, badge: stats?.active_listings },
    { id: 'offers' as TabType, label: 'Модерация', icon: FileText, badge: stats?.open_tickets },
    { id: 'messages' as TabType, label: 'Тикеты', icon: MessageSquare, badge: stats?.open_tickets },
    ...(user?.role === 'admin' ? [{ id: 'users' as TabType, label: 'Сотрудники', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Панель управления</h1>
          <p className="text-muted-foreground mt-1">{user?.full_name} • {user?.role === 'admin' ? 'Администратор' : 'Менеджер'}</p>
        </div>
        <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${isActive ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-background/20 text-background' : 'bg-destructive/10 text-destructive'}`}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
        {activeTab === 'stats' && <StatsTab stats={stats} loading={statsLoading} />}
        {activeTab === 'cars' && <CarsTab />}
        {activeTab === 'offers' && <OffersTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'users' && user?.role === 'admin' && <UsersTab />}
      </div>
    </div>
  );
}