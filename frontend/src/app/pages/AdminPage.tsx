import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Car, Users, FileText, BarChart3, Plus, Edit, Trash2,
  Check, X, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  MessageSquare, DollarSign, AlertCircle, Eye, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router';
import {
  adminApi,
  type AdminUser, type AdminCar, type AdminCarOffer,
  type AdminMessage, type DashboardStats,
  type UserCreate, type UserRole, type UserStatus,
  type CarOfferStatus, type MessageStatus,
} from '../api/admin';

type TabType = 'stats' | 'cars' | 'offers' | 'messages' | 'users';

// 🔽 Helpers
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
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-accent/10 text-accent',
  rejected: 'bg-destructive/10 text-destructive',
};
const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении', approved: 'Одобрена', rejected: 'Отклонена',
};
const MSG_STATUS_LABELS: Record<string, string> = {
  new: 'Новое', in_progress: 'В работе', resolved: 'Решено', closed: 'Закрыто',
};
const MSG_STATUS_COLORS: Record<string, string> = {
  new: 'bg-accent/10 text-accent',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-muted text-muted-foreground',
  closed: 'bg-secondary text-muted-foreground',
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

// 🔽 Утилита для дебаунса
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
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
      <p className="text-sm text-muted-foreground">
        {skip + 1}–{Math.min(skip + limit, count)} из {count}
      </p>
      <div className="flex gap-2">
        <button onClick={() => onChange(skip - limit)} disabled={skip === 0}
          className="p-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 text-sm">{page} / {total}</span>
        <button onClick={() => onChange(skip + limit)} disabled={skip + limit >= count}
          className="p-2 border border-border rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Stats Tab
function StatsTab({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  if (loading) return <LoadingSpinner />;
  if (!stats) return <ErrorState message="Не удалось загрузить статистику" />;

  const cards = [
    { label: 'Всего авто', value: stats.total_cars, sub: `${stats.available_cars} доступно`, icon: Car, color: 'bg-primary/10 text-primary' },
    { label: 'Продано', value: stats.sold_cars, sub: `${stats.reserved_cars} зарезервировано`, icon: DollarSign, color: 'bg-accent/10 text-accent' },
    { label: 'Всего сделок', value: stats.total_deals, sub: `${stats.completed_deals} завершено`, icon: BarChart3, color: 'bg-purple-100 text-purple-700' },
    { label: 'Выручка', value: formatPrice(stats.total_revenue), sub: 'По завершённым сделкам', icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Клиентов', value: stats.total_clients, sub: 'Всего в базе', icon: Users, color: 'bg-orange-100 text-orange-700' },
    { label: 'Новых сообщений', value: stats.new_messages, sub: 'Ожидают ответа', icon: MessageSquare, color: 'bg-destructive/10 text-destructive' },
    { label: 'Заявок на продажу', value: stats.pending_offers, sub: `Всего: ${stats.total_offers}`, icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Просмотров', value: stats.total_viewings, sub: 'Всего записей', icon: Eye, color: 'bg-cyan-100 text-cyan-700' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Статистика</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🔽 Компонент строки таблицы автомобиля
function CarTableRow({ car, onEdit, onDelete, onStatusChange }: {
  car: AdminCar;
  onEdit: (car: AdminCar) => void;
  onDelete: (id: string, name: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <tr key={car.id} className="hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-semibold">{car.brand} {car.model}</p>
          {car.color && <p className="text-xs text-muted-foreground">{car.color}</p>}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{car.year}</td>
      <td className="px-4 py-3 font-medium">{formatPrice(car.price)}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatMileage(car.mileage)}</td>
      <td className="px-4 py-3">
        <select value={car.status} onChange={e => onStatusChange(car.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${CAR_STATUS_COLORS[car.status]}`}>
          {Object.entries(CAR_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
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

// Cars Tab
function CarsTab() {
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCar, setEditCar] = useState<AdminCar | null>(null);
  const [form, setForm] = useState<{
    brand: string; model: string; year: string; price: string; mileage: string;
    color: string; fuel_type: string; transmission: string; body_type: string;
    engine_volume: string; engine_power: string; description: string; vin: string;
  }>({ brand: '', model: '', year: '', price: '', mileage: '0', color: '', fuel_type: '', transmission: '', body_type: '', engine_volume: '', engine_power: '', description: '', vin: '' });
  const [saving, setSaving] = useState(false);

  // 🔽 Поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminCar[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchAbortRef = useRef<AbortController | null>(null);

  // 🔽 Фильтр по статусу
  const [filterStatus, setFilterStatus] = useState<string>('');

  const load = useCallback(async () => {
    if (searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await adminApi.getCars(skip);
      if (filterStatus) {
        const filtered = data.data.filter(c => c.status === filterStatus);
        setCars(filtered); setCount(filtered.length);
      } else {
        setCars(data.data); setCount(data.count);
      }
    } catch { toast.error('Ошибка загрузки авто'); }
    finally { setLoading(false); }
  }, [skip, searchQuery, filterStatus]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    try {
      const data = await adminApi.getCars(0);
      const q = query.toLowerCase();
      let results = data.data.filter(c => 
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.vin && c.vin.toLowerCase().includes(q))
      );
      if (filterStatus) results = results.filter(c => c.status === filterStatus);
      setSearchResults(results);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Ошибка поиска');
        setSearchResults([]);
      }
    } finally { setSearchLoading(false); }
  }, [filterStatus]);

  useEffect(() => { performSearch(debouncedSearch); }, [debouncedSearch, performSearch]);
  useEffect(() => { load(); }, [load]);

  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSkip(0); };
  
  // 🔽 Исправлено: сбрасывает фильтр И пагинацию одновременно
  const handleFilterChange = (status: string) => {
    setFilterStatus(prev => prev === status ? '' : status);
    setSkip(0);
  };
  
  const clearFilters = () => { setFilterStatus(''); setSkip(0); };

  const openCreate = () => {
    setEditCar(null);
    setForm({ brand: '', model: '', year: '', price: '', mileage: '0', color: '', fuel_type: '', transmission: '', body_type: '', engine_volume: '', engine_power: '', description: '', vin: '' });
    setShowForm(true);
  };

  const openEdit = (car: AdminCar) => {
    setEditCar(car);
    setForm({
      brand: car.brand, model: car.model, year: String(car.year),
      price: String(car.price), mileage: String(car.mileage),
      color: car.color ?? '', fuel_type: car.fuel_type ?? '',
      transmission: car.transmission ?? '', body_type: car.body_type ?? '',
      engine_volume: car.engine_volume ?? '', engine_power: String(car.engine_power ?? ''),
      description: car.description ?? '', vin: car.vin ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        brand: form.brand, model: form.model, year: Number(form.year), price: Number(form.price),
        mileage: Number(form.mileage),
        ...(form.color && { color: form.color }), ...(form.fuel_type && { fuel_type: form.fuel_type }),
        ...(form.transmission && { transmission: form.transmission }), ...(form.body_type && { body_type: form.body_type }),
        ...(form.engine_volume && { engine_volume: Number(form.engine_volume) }), ...(form.engine_power && { engine_power: Number(form.engine_power) }),
        ...(form.description && { description: form.description }), ...(form.vin && { vin: form.vin }),
      };
      if (editCar) await adminApi.updateCar(editCar.id, body);
      else await adminApi.createCar(body);
      toast.success(editCar ? 'Автомобиль обновлён' : 'Автомобиль добавлен');
      setShowForm(false);
      if (searchQuery.trim()) performSearch(searchQuery); else load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить "${name}"?`)) return;
    try {
      await adminApi.deleteCar(id);
      toast.success('Автомобиль удалён');
      if (searchQuery.trim()) performSearch(searchQuery); else load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminApi.updateCar(id, { status: status as AdminCar['status'] });
      toast.success('Статус обновлён');
      if (searchQuery.trim()) performSearch(searchQuery); else load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const isSearching = searchQuery.trim().length > 0;
  const hasActiveFilters = !!filterStatus;
  const displayedCars = isSearching ? searchResults : cars;
  const displayedCount = isSearching ? searchResults.length : count;
  const isLoading = isSearching ? searchLoading : (loading && cars.length === 0);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">
            Автомобили <span className="text-muted-foreground text-lg font-normal">
              ({displayedCount}){isSearching && ` • поиск: "${searchQuery}"`}{hasActiveFilters && !isSearching && ' • фильтры активны'}
            </span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" /> Сбросить фильтры
              </button>
            )}
            <button onClick={isSearching ? clearSearch : load} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors" title={isSearching ? 'Очистить поиск' : 'Обновить'}>
              {isSearching ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск по марке, модели, VIN..." className="w-full pl-10 pr-10 py-2.5 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>

        {/* 🔽 Фильтр по статусу */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Статус:</span>
            <button onClick={() => handleFilterChange('')} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterStatus ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>Все</button>
            {Object.entries(CAR_STATUS_LABELS).map(([v, l]) => (
              <button key={v} onClick={() => handleFilterChange(v)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterStatus === v ? `${CAR_STATUS_COLORS[v]} ring-2 ring-offset-1 ring-primary/20` : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {searchLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Поиск...</div>}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>{['Автомобиль', 'Год', 'Цена', 'Пробег', 'Статус', 'Действия'].map(h => (<th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedCars.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{isSearching ? searchLoading ? 'Поиск...' : 'По вашему запросу ничего не найдено' : hasActiveFilters ? 'Нет автомобилей с выбранным статусом' : 'Список автомобилей пуст'}</td></tr>
              ) : displayedCars.map(car => (
                <CarTableRow key={car.id} car={car} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 🔽 Пагинация скрывается при поиске ИЛИ активном фильтре */}
      {!isSearching && !hasActiveFilters && <Pagination skip={skip} limit={20} count={count} onChange={setSkip} />}

      {showForm && (
        <Modal title={editCar ? 'Редактировать авто' : 'Добавить авто'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['brand', 'Марка *', 'text', true], ['model', 'Модель *', 'text', true], ['year', 'Год *', 'number', true], ['price', 'Цена (₽) *', 'number', true], ['mileage', 'Пробег (км)', 'number', false], ['color', 'Цвет', 'text', false], ['engine_volume', 'Объём двигателя (л)', 'number', false], ['engine_power', 'Мощность (л.с.)', 'number', false], ['vin', 'VIN', 'text', false]].map(([key, label, type, required]) => (
                <div key={key as string}>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">{label as string}</label>
                  <input type={type as string} required={required as boolean} value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
              ))}
              <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Тип топлива</label>
                <select value={form.fuel_type} onChange={e => setForm(p => ({ ...p, fuel_type: e.target.value }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Не указано</option>{[['petrol', 'Бензин'], ['diesel', 'Дизель'], ['electric', 'Электро'], ['hybrid', 'Гибрид'], ['gas', 'Газ']].map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select></div>
              <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">КПП</label>
                <select value={form.transmission} onChange={e => setForm(p => ({ ...p, transmission: e.target.value }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Не указано</option>{[['manual', 'Механика'], ['automatic', 'Автомат'], ['robot', 'Робот'], ['variator', 'Вариатор']].map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select></div>
              <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Кузов</label>
                <select value={form.body_type} onChange={e => setForm(p => ({ ...p, body_type: e.target.value }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Не указано</option>{[['sedan', 'Седан'], ['hatchback', 'Хэтчбек'], ['suv', 'Внедорожник'], ['coupe', 'Купе'], ['wagon', 'Универсал'], ['minivan', 'Минивэн'], ['pickup', 'Пикап']].map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select></div>
            </div>
            <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Описание</label>
              <textarea value={form.description} rows={3} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/80 transition-colors">Отмена</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editCar ? 'Сохранить' : 'Добавить'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Offers Tab
function OffersTab() {
  const [offers, setOffers] = useState<AdminCarOffer[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filterStatus, setFilterStatus] = useState<CarOfferStatus | ''>('');
  const [loading, setLoading] = useState(true);
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
      setSearchResults(data.data.filter(o => 
        o.brand.toLowerCase().includes(q) || o.model.toLowerCase().includes(q) ||
        String(o.year).includes(q) || String(o.price).includes(q) ||
        (o.user_name && o.user_name.toLowerCase().includes(q)) || (o.user_phone && o.user_phone.toLowerCase().includes(q))
      ));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') { toast.error('Ошибка поиска'); setSearchResults([]); }
    } finally { setSearchLoading(false); }
  }, [filterStatus]);

  useEffect(() => { performSearch(debouncedSearch); }, [debouncedSearch, performSearch]);
  useEffect(() => { load(); }, [load]);
  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSkip(0); };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try { await adminApi.reviewOffer(id, 'approved'); toast.success('Заявка одобрена'); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); } finally { setProcessing(null); }
  };
  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try { await adminApi.reviewOffer(rejectModal.id, 'rejected', rejectReason || undefined); toast.success('Заявка отклонена'); setRejectModal(null); setRejectReason(''); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); } finally { setProcessing(null); }
  };

  const isSearching = searchQuery.trim().length > 0;
  const displayedOffers = isSearching ? searchResults : offers;
  const displayedCount = isSearching ? searchResults.length : count;
  const isLoading = isSearching ? searchLoading : (loading && offers.length === 0);
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Заявки на продажу <span className="text-muted-foreground text-lg font-normal">({displayedCount}){isSearching && ` • поиск: "${searchQuery}"`}</span></h2>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as CarOfferStatus | ''); setSkip(0); }} className="px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="">Все статусы</option><option value="pending">На рассмотрении</option><option value="approved">Одобренные</option><option value="rejected">Отклонённые</option>
            </select>
            <button onClick={isSearching ? clearSearch : load} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors" title={isSearching ? 'Очистить поиск' : 'Обновить'}>
              {isSearching ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск по марке, модели, году, цене, имени..." className="w-full pl-10 pr-10 py-2.5 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        {searchLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Поиск...</div>}
      </div>

      <div className="space-y-3">
        {displayedOffers.length === 0 && !searchLoading && <EmptyTableState text={isSearching ? 'По вашему запросу ничего не найдено' : 'Заявок нет'} />}
        {displayedOffers.map(offer => {
          const primaryImg = offer.images.find(i => i.is_primary) ?? offer.images[0];
          return (
            <div key={offer.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex gap-4">
                {primaryImg && <div className="w-24 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-secondary"><img src={primaryImg.thumb_url} alt={`${offer.brand} ${offer.model}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold">{offer.brand} {offer.model} {offer.year}</h3>
                      <p className="text-sm text-muted-foreground">{formatPrice(offer.price)} • {formatMileage(offer.mileage)} • {offer.images.length} фото</p>
                      <p className="text-xs text-muted-foreground">{formatDate(offer.created_at)} • {offer.user_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${OFFER_STATUS_COLORS[offer.status]}`}>{OFFER_STATUS_LABELS[offer.status]}</span>
                  </div>
                  {offer.rejection_reason && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{offer.rejection_reason}</p>}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleApprove(offer.id)} disabled={processing === offer.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50">{processing === offer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Одобрить</button>
                      <button onClick={() => setRejectModal({ id: offer.id, brand: offer.brand, model: offer.model })} disabled={processing === offer.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors disabled:opacity-50"><X className="w-3.5 h-3.5" /> Отклонить</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!isSearching && <Pagination skip={skip} limit={20} count={count} onChange={setSkip} />}

      {rejectModal && (
        <Modal title={`Отклонить заявку: ${rejectModal.brand} ${rejectModal.model}`} onClose={() => setRejectModal(null)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-semibold mb-2">Причина отклонения (необязательно)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="Укажите причину для пользователя..." className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" /></div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/80 transition-colors">Отмена</button>
              <button onClick={handleReject} disabled={!!processing} className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">{processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Отклонить'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Messages Tab
function MessagesTab() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filterStatus, setFilterStatus] = useState<MessageStatus | ''>('new');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminMessage[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchAbortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (searchQuery.trim()) return;
    setLoading(true);
    try { const data = await adminApi.getMessages(filterStatus || undefined, skip); setMessages(data.data); setCount(data.count); }
    catch { toast.error('Ошибка загрузки сообщений'); } finally { setLoading(false); }
  }, [skip, filterStatus, searchQuery]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    try {
      const data = await adminApi.getMessages(filterStatus || undefined, 0);
      const q = query.toLowerCase();
      setSearchResults(data.data.filter(m => 
        (m.subject && m.subject.toLowerCase().includes(q)) || m.message_type.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) || (m.phone && m.phone.toLowerCase().includes(q))
      ));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') { toast.error('Ошибка поиска'); setSearchResults([]); }
    } finally { setSearchLoading(false); }
  }, [filterStatus]);

  useEffect(() => { performSearch(debouncedSearch); }, [debouncedSearch, performSearch]);
  useEffect(() => { load(); }, [load]);
  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSkip(0); };

  const handleStatusChange = async (id: string, status: MessageStatus) => {
    setProcessing(id);
    try { await adminApi.updateMessage(id, { status }); toast.success('Статус обновлён'); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); } finally { setProcessing(null); }
  };

  const isSearching = searchQuery.trim().length > 0;
  const displayedMessages = isSearching ? searchResults : messages;
  const displayedCount = isSearching ? searchResults.length : count;
  const isLoading = isSearching ? searchLoading : (loading && messages.length === 0);
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Сообщения <span className="text-muted-foreground text-lg font-normal">({displayedCount}){isSearching && ` • поиск: "${searchQuery}"`}</span></h2>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as MessageStatus | ''); setSkip(0); }} className="px-3 py-2 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
              <option value="">Все</option><option value="new">Новые</option><option value="in_progress">В работе</option><option value="resolved">Решено</option><option value="closed">Закрыто</option>
            </select>
            <button onClick={isSearching ? clearSearch : load} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors" title={isSearching ? 'Очистить поиск' : 'Обновить'}>
              {isSearching ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск по теме, тексту, имени, email, телефону..." className="w-full pl-10 pr-10 py-2.5 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        {searchLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Поиск...</div>}
      </div>

      <div className="space-y-2">
        {displayedMessages.length === 0 && !searchLoading && <EmptyTableState text={isSearching ? 'По вашему запросу ничего не найдено' : 'Сообщений нет'} />}
        {displayedMessages.map(msg => (
          <div key={msg.id} className="bg-white rounded-xl border border-border overflow-hidden">
            <button onClick={() => setExpanded(expanded === msg.id ? null : msg.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors text-left">
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${MSG_STATUS_COLORS[msg.status]}`}>{MSG_STATUS_LABELS[msg.status]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{msg.subject ?? msg.message_type}</p>
                <p className="text-xs text-muted-foreground">{msg.name} • {msg.email} • {formatDate(msg.created_at)}</p>
              </div>
            </button>
            {expanded === msg.id && (
              <div className="px-4 pb-4 border-t border-border">
                <p className="text-sm mt-3 text-muted-foreground leading-relaxed">{msg.body}</p>
                {msg.phone && <p className="text-sm mt-2"><span className="font-medium">Телефон:</span> {msg.phone}</p>}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(['new', 'in_progress', 'resolved', 'closed'] as MessageStatus[]).map(s => (
                    <button key={s} onClick={() => handleStatusChange(msg.id, s)} disabled={msg.status === s || processing === msg.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${msg.status === s ? `${MSG_STATUS_COLORS[s]} cursor-default` : 'bg-secondary hover:bg-secondary/80'}`}>
                      {processing === msg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : MSG_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!isSearching && <Pagination skip={skip} limit={20} count={count} onChange={setSkip} />}
    </div>
  );
}

// Users Tab
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(0);
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
    if (searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await adminApi.getUsers(skip);
      let filtered = data.data;
      if (filterStatus) filtered = filtered.filter(u => u.status === filterStatus);
      if (filterRole) filtered = filtered.filter(u => u.role === filterRole);
      setUsers(filtered); setCount(filtered.length);
    } catch { toast.error('Ошибка загрузки пользователей'); }
    finally { setLoading(false); }
  }, [skip, searchQuery, filterStatus, filterRole]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    searchAbortRef.current = new AbortController();
    try {
      const data = await adminApi.getUsers(0);
      const q = query.toLowerCase();
      let results = data.data.filter(u => 
        u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) || USER_ROLE_LABELS[u.role].toLowerCase().includes(q) || u.status.toLowerCase().includes(q)
      );
      if (filterStatus) results = results.filter(u => u.status === filterStatus);
      if (filterRole) results = results.filter(u => u.role === filterRole);
      setSearchResults(results);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') { toast.error('Ошибка поиска'); setSearchResults([]); }
    } finally { setSearchLoading(false); }
  }, [filterStatus, filterRole]);

  useEffect(() => { performSearch(debouncedSearch); }, [debouncedSearch, performSearch]);
  useEffect(() => { load(); }, [load]);
  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setSkip(0); };
  const clearFilters = () => { setFilterStatus(''); setFilterRole(''); setSkip(0); };

  const openCreate = () => { setEditUser(null); setForm({ full_name: '', email: '', password: '', role: 'manager' }); setShowForm(true); };
  const openEdit = (u: AdminUser) => { setEditUser(u); setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, status: u.status }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editUser) {
        const body: Record<string, unknown> = { full_name: form.full_name, email: form.email, role: form.role, status: form.status };
        if (form.password) body.password = form.password;
        await adminApi.updateUser(editUser.id, body); toast.success('Пользователь обновлён');
      } else { await adminApi.createUser({ full_name: form.full_name, email: form.email, password: form.password, role: form.role }); toast.success('Пользователь создан'); }
      setShowForm(false);
      if (searchQuery.trim()) performSearch(searchQuery); else load();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u: AdminUser) => {
    if (u.id === currentUser?.id) { toast.error('Нельзя удалить себя'); return; }
    if (!confirm(`Удалить пользователя "${u.full_name}"?`)) return;
    try { await adminApi.deleteUser(u.id); toast.success('Пользователь удалён'); if (searchQuery.trim()) performSearch(searchQuery); else load(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const isSearching = searchQuery.trim().length > 0;
  const hasActiveFilters = filterStatus || filterRole;
  const displayedUsers = isSearching ? searchResults : users;
  const displayedCount = isSearching ? searchResults.length : count;
  const isLoading = isSearching ? searchLoading : (loading && users.length === 0);
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">
            Сотрудники <span className="text-muted-foreground text-lg font-normal">
              ({displayedCount}){isSearching && ` • поиск: "${searchQuery}"`}{hasActiveFilters && !isSearching && ' • фильтры активны'}
            </span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg text-sm hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" /> Сбросить фильтры
              </button>
            )}
            <button onClick={isSearching ? clearSearch : load} className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors" title={isSearching ? 'Очистить поиск' : 'Обновить'}>
              {isSearching ? <X className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск по имени, email, телефону, роли..." className="w-full pl-10 pr-10 py-2.5 bg-white border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Статус:</span>
            <button onClick={() => setFilterStatus('')} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterStatus ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>Все</button>
            {(['active', 'inactive', 'banned'] as UserStatus[]).map(status => (
              <button key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterStatus === status ? `${USER_STATUS_COLORS[status]} ring-2 ring-offset-1 ring-primary/20` : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                {USER_STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Роль:</span>
            <button onClick={() => setFilterRole('')} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${!filterRole ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>Все</button>
            {(['admin', 'manager', 'support', 'user'] as UserRole[]).map(role => (
              <button key={role} onClick={() => setFilterRole(filterRole === role ? '' : role)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${filterRole === role ? 'bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary/20' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}>
                {USER_ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {searchLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Поиск...</div>}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>{['Имя', 'Email', 'Роль', 'Статус', 'Дата', 'Действия'].map(h => (<th key={h} className="px-4 py-3 text-left font-semibold text-muted-foreground">{h}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{isSearching ? searchLoading ? 'Поиск...' : 'По вашему запросу ничего не найдено' : hasActiveFilters ? 'Нет пользователей с выбранными фильтрами' : 'Список сотрудников пуст'}</td></tr>
              ) : displayedUsers.map(u => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3"><p className="font-semibold">{u.full_name}</p>{u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-medium">{USER_ROLE_LABELS[u.role]}</span></td>
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
            {[['full_name', 'Полное имя *', 'text', true], ['email', 'Email *', 'email', true], ['password', editUser ? 'Новый пароль (оставьте пустым)' : 'Пароль *', 'password', !editUser]].map(([key, label, type, required]) => (
              <div key={key as string}><label className="block text-xs font-semibold mb-1 text-muted-foreground">{label as string}</label>
                <input type={type as string} required={required as boolean} value={form[key as keyof typeof form] as string ?? ''} onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Роль</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(USER_ROLE_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
              </select></div>
            {editUser && <div><label className="block text-xs font-semibold mb-1 text-muted-foreground">Статус</label>
              <select value={form.status ?? 'active'} onChange={e => setForm(p => ({ ...p, status: e.target.value as UserStatus }))} className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="active">Активен</option><option value="inactive">Неактивен</option><option value="banned">Заблокирован</option>
              </select></div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/80 transition-colors">Отмена</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">{saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editUser ? 'Сохранить' : 'Создать'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Shared UI
function LoadingSpinner() { return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>; }
function ErrorState({ message }: { message: string }) { return <div className="flex flex-col items-center justify-center py-16 text-center"><AlertCircle className="w-10 h-10 text-destructive mb-3" /><p className="text-muted-foreground">{message}</p></div>; }
function EmptyTableState({ text }: { text: string }) { return <div className="bg-white rounded-xl border border-border py-12 text-center"><p className="text-muted-foreground">{text}</p></div>; }

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Main Page
export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
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

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const tabs = [
    { id: 'stats' as TabType, label: 'Статистика', icon: BarChart3 },
    { id: 'cars' as TabType, label: 'Автомобили', icon: Car, badge: stats?.available_cars },
    { id: 'offers' as TabType, label: 'Заявки на продажу', icon: FileText, badge: stats?.pending_offers },
    { id: 'messages' as TabType, label: 'Сообщения', icon: MessageSquare, badge: stats?.new_messages },
    ...(user?.role === 'admin' ? [{ id: 'users' as TabType, label: 'Сотрудники', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Панель управления</h1>
          <p className="text-muted-foreground mt-1">{user?.full_name} • {user?.role === 'admin' ? 'Администратор' : 'Менеджер'}</p>
        </div>

        <div className="flex gap-1 mb-6 bg-white border border-border rounded-xl p-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${isActive ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                <Icon className="w-4 h-4" /> {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-destructive/10 text-destructive'}`}>{tab.badge}</span>
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