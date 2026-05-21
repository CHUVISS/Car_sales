import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { CarCard } from '../components/CarCard';
import { SlidersHorizontal, X, ChevronDown, Check, Search } from 'lucide-react';
import { useCars } from '../hooks/useCars';
import type { CarFilters, FuelType, Transmission, Car as CarType } from '../api/cars';

// Константы
const ALL_BRANDS = ['Audi', 'BMW', 'Hyundai', 'Kia', 'Lexus', 'Mazda', 'Mercedes', 'Nissan', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen'];
const ALL_COLORS = ['Белый', 'Синий', 'Серый', 'Красный', 'Серебристый', 'Черный'];
const TRANSMISSIONS = [['automatic', 'Автомат'], ['manual', 'Механика'], ['robot', 'Робот'], ['variator', 'Вариатор']] as const;
const FUELS = [['petrol', 'Бензин'], ['diesel', 'Дизель'], ['electric', 'Электро'], ['hybrid', 'Гибрид'], ['gas', 'Газ']] as const;

const normalizeColor = (c: string) => c.trim().toLowerCase().replace(/ё/g, 'е');

// Выпадающий список с поиском
function SearchableMultiSelect<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
  placeholder = 'Выберите...',
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  
  const selectedLabels = selected.map(val => options.find(opt => opt.value === val)?.label ?? val);
  const displayText = selected.length > 0 ? selectedLabels.join(', ') : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{label}</h3>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Очистить
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary rounded-lg text-sm text-left hover:bg-secondary/80 transition-colors min-h-[40px]"
      >
        <span 
          className={`overflow-hidden text-ellipsis whitespace-nowrap ${selected.length > 0 ? 'text-primary' : 'text-muted-foreground'}`}
          title={displayText}
        >
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-secondary rounded outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selected.includes(opt.value) ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {selected.includes(opt.value) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected.includes(opt.value)}
                    onChange={() => onToggle(opt.value)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">Ничего не найдено</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент: Ввод чисел
function NumberFilterInput({
  placeholder,
  value,
  onChange,
  onConfirm
}: {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onConfirm: (val: string) => void;
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '');
    if (clean !== value) onChange(clean);
  };

  const handleConfirm = () => {
    const trimmed = value.trim();
    onConfirm(trimmed === '' ? '' : trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onBlur={handleConfirm}
      onKeyDown={handleKeyDown}
      className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

// 🔍 Компонент поиска с выпадающими результатами и скроллом
function CatalogSearch({
  cars,
  onSelect,
  placeholder = 'Поиск по марке или модели...',
}: {
  cars: CarType[];
  onSelect: (car: CarType | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Фильтрация + дебаунс (простой вариант)
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return cars.filter(car => 
      car.brand.toLowerCase().includes(q) || 
      car.model.toLowerCase().includes(q) ||
      `${car.brand} ${car.model}`.toLowerCase().includes(q)
    ).slice(0, 10); // Ограничиваем 10 результатами для производительности
  }, [cars, query]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && filtered[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filtered[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (car: CarType) => {
    onSelect(car);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    onSelect(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Выпадающие результаты со скроллом */}
      {isOpen && (query.trim() || filtered.length > 0) && (
        <div className="absolute z-30 w-full mt-2 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((car, idx) => (
                <button
                  key={car.id}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(car)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors ${
                    highlightedIndex === idx ? 'bg-secondary/50' : ''
                  }`}
                >
                  <div className="w-12 h-12 bg-secondary rounded-md flex-shrink-0 overflow-hidden">
                    {car.images?.[0]?.url ? (
                      <img src={car.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">🚗</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{car.brand} {car.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {car.year} • {car.mileage.toLocaleString('ru-RU')} км • {Number(car.price).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </button>
              ))
            ) : query.trim() ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Ничего не найдено по запросу «{query}»
              </div>
            ) : null}
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t border-border">
              Показано {filtered.length} из {cars.length} • Нажмите Enter для выбора
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Основная страница
export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [displayPriceMin, setDisplayPriceMin] = useState('');
  const [displayPriceMax, setDisplayPriceMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  
  const [displayMileageMin, setDisplayMileageMin] = useState('');
  const [displayMileageMax, setDisplayMileageMax] = useState('');
  const [mileageMin, setMileageMin] = useState('');
  const [mileageMax, setMileageMax] = useState('');

  const [displayYearMin, setDisplayYearMin] = useState('');
  const [displayYearMax, setDisplayYearMax] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<Transmission[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<FuelType[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isNew, setIsNew] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<CarFilters['sort_by']>('date_desc');
  
  // Состояние для поиска по каталогу
  const [searchQuery, setSearchQuery] = useState('');

  // Инициализация из URL
  useEffect(() => {
    const b = searchParams.get('brands'); if (b) setSelectedBrands(b.split(',').filter(Boolean));
    const t = searchParams.get('transmissions'); if (t) setSelectedTransmissions(t.split(',') as Transmission[]);
    const f = searchParams.get('fuels'); if (f) setSelectedFuels(f.split(',') as FuelType[]);
    const c = searchParams.get('colors'); if (c) setSelectedColors(c.split(',').filter(Boolean));
    
    const pMin = searchParams.get('price_min'); if (pMin) { setDisplayPriceMin(pMin); setPriceMin(pMin); }
    const pMax = searchParams.get('price_max'); if (pMax) { setDisplayPriceMax(pMax); setPriceMax(pMax); }
    const mMin = searchParams.get('mileage_min'); if (mMin) { setDisplayMileageMin(mMin); setMileageMin(mMin); }
    const mMax = searchParams.get('mileage_max'); if (mMax) { setDisplayMileageMax(mMax); setMileageMax(mMax); }
    const yMin = searchParams.get('year_min'); if (yMin) { setDisplayYearMin(yMin); setYearMin(yMin); }
    const yMax = searchParams.get('year_max'); if (yMax) { setDisplayYearMax(yMax); setYearMax(yMax); }
    
    const n = searchParams.get('isNew');
    if (n === 'true') setIsNew(true);
    else if (n === 'false') setIsNew(false);
    
    const s = searchParams.get('sort_by');
    if (s) setSortBy(s as CarFilters['sort_by']);
    
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, []);

  // Синхронизация в URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedBrands.length) params.set('brands', selectedBrands.join(','));
    if (selectedTransmissions.length) params.set('transmissions', selectedTransmissions.join(','));
    if (selectedFuels.length) params.set('fuels', selectedFuels.join(','));
    if (selectedColors.length) params.set('colors', selectedColors.join(','));
    if (priceMin) params.set('price_min', priceMin);
    if (priceMax) params.set('price_max', priceMax);
    if (mileageMin) params.set('mileage_min', mileageMin);
    if (mileageMax) params.set('mileage_max', mileageMax);
    if (yearMin) params.set('year_min', yearMin);
    if (yearMax) params.set('year_max', yearMax);
    if (isNew === true) params.set('isNew', 'true');
    else if (isNew === false) params.set('isNew', 'false');
    if (sortBy && sortBy !== 'date_desc') params.set('sort_by', sortBy);
    if (searchQuery) params.set('q', searchQuery);

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [selectedBrands, selectedTransmissions, selectedFuels, selectedColors, priceMin, priceMax, mileageMin, mileageMax, yearMin, yearMax, isNew, sortBy, searchQuery]);

  // Фильтры для API
  const apiFilters: CarFilters = useMemo(() => {
    const f: CarFilters = { sort_by: sortBy, limit: 100 };
    if (selectedBrands.length === 1) f.brand = selectedBrands[0];
    if (priceMin) f.price_from = Number(priceMin);
    if (priceMax) f.price_to = Number(priceMax);
    if (yearMin) f.year_from = Number(yearMin);
    if (yearMax) f.year_to = Number(yearMax);
    if (selectedTransmissions.length === 1) f.transmission = selectedTransmissions[0];
    if (selectedFuels.length === 1) f.fuel_type = selectedFuels[0];
    if (isNew === true) f.status = 'available';
    return f;
  }, [sortBy, selectedBrands, selectedTransmissions, selectedFuels, isNew, priceMin, priceMax, yearMin, yearMax]);

  const { cars, loading, error } = useCars(apiFilters);

  const toggleBrand = (brand: string) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  const toggleTransmission = (t: Transmission) => setSelectedTransmissions(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleFuel = (f: FuelType) => setSelectedFuels(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleColor = (c: string) => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const resetFilters = () => {
    setSelectedBrands([]); setSelectedTransmissions([]); setSelectedFuels([]); setSelectedColors([]);
    setIsNew(undefined); setSortBy('date_desc'); setSearchQuery('');
    setPriceMin(''); setPriceMax(''); setMileageMin(''); setMileageMax(''); setYearMin(''); setYearMax('');
    setDisplayPriceMin(''); setDisplayPriceMax(''); setDisplayMileageMin(''); setDisplayMileageMax(''); setDisplayYearMin(''); setDisplayYearMax('');
    setSearchParams({});
  };

  // Фильтрация по поисковому запросу
  const searchFilteredCars = useMemo(() => {
    if (!searchQuery.trim()) return cars;
    const q = searchQuery.toLowerCase().trim();
    return cars.filter(car => 
      car.brand.toLowerCase().includes(q) || 
      car.model.toLowerCase().includes(q) ||
      `${car.brand} ${car.model}`.toLowerCase().includes(q) ||
      car.description?.toLowerCase().includes(q)
    );
  }, [cars, searchQuery]);

  // Клиентская фильтрация (остальные фильтры)
  const filteredCars = useMemo(() => {
    let result = [...searchFilteredCars];
    
    if (selectedBrands.length > 1) result = result.filter(car => selectedBrands.includes(car.brand));
    if (selectedTransmissions.length > 1) result = result.filter(car => selectedTransmissions.includes(car.transmission as Transmission));
    if (selectedFuels.length > 1) result = result.filter(car => selectedFuels.includes(car.fuel_type as FuelType));
    
    if (selectedColors.length > 0) {
      const normalizedSelected = selectedColors.map(normalizeColor);
      result = result.filter(car => car.color && normalizedSelected.includes(normalizeColor(car.color)));
    }

    const pMin = priceMin ? Number(priceMin) : null;
    const pMax = priceMax ? Number(priceMax) : null;
    const mMin = mileageMin ? Number(mileageMin) : null;
    const mMax = mileageMax ? Number(mileageMax) : null;

    if (pMin !== null || pMax !== null) {
      result = result.filter(car => {
        const price = Number(car.price);
        if (pMin !== null && price < pMin) return false;
        if (pMax !== null && price > pMax) return false;
        return true;
      });
    }
    if (mMin !== null || mMax !== null) {
      result = result.filter(car => {
        const mileage = Number(car.mileage);
        if (mMin !== null && mileage < mMin) return false;
        if (mMax !== null && mileage > mMax) return false;
        return true;
      });
    }

    return result;
  }, [searchFilteredCars, selectedBrands, selectedTransmissions, selectedFuels, selectedColors, priceMin, priceMax, mileageMin, mileageMax]);

  const adaptedCars = useMemo(() => filteredCars.map(car => ({
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    price: Number(car.price),
    mileage: car.mileage,
    transmission: (car.transmission === 'automatic' || car.transmission === 'robot' || car.transmission === 'variator') ? 'automatic' as const : 'manual' as const,
    fuel: (car.fuel_type ?? 'petrol') as 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'gas',
    color: car.color ?? '',
    engineVolume: Number(car.engine_volume ?? 0),
    drive: 'front' as const,
    body: (car.body_type ?? 'sedan') as 'sedan' | 'suv' | 'hatchback' | 'wagon' | 'coupe' | 'minivan',
    power: car.engine_power ?? 0,
    images: car.images.length > 0 ? car.images.map(img => img.url) : ['placeholder'],
    description: car.description ?? '',
    isNew: car.status === 'available' && car.mileage === 0,
    createdAt: car.created_at,
    vin: car.vin ?? undefined,
  })), [filteredCars]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок + Поиск */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold mb-1">Каталог автомобилей</h1>
              <p className="text-muted-foreground">
                {loading ? 'Загрузка...' : `Найдено: ${adaptedCars.length} автомобилей`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Фильтры</span>
              </button>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as CarFilters['sort_by'])}
                className="px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="date_desc">По дате добавления</option>
                <option value="price_asc">По возрастанию цены</option>
                <option value="price_desc">По убыванию цены</option>
                <option value="year_desc">По году выпуска</option>
              </select>
            </div>
          </div>

          {/* 🔍 Поиск по каталогу с выпадающими результатами */}
          <CatalogSearch
            cars={cars}
            placeholder="Поиск по марке или модели..."
            onSelect={car => {
              if (car) {
                // При выборе из подсказок — переходим к машине
                navigate(`/car/${car.id}`);
              }
            }}
          />
          
          {/* Отображение активного поискового запроса */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Поиск: «{searchQuery}»</span>
              <button 
                onClick={() => { setSearchQuery(''); setSearchParams(prev => { prev.delete('q'); return prev; }); }}
                className="text-destructive hover:underline"
              >
                очистить
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Десктопные фильтры */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-border p-6 sticky top-20 space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Цена, ₽</h3>
                <div className="flex gap-2">
                  <NumberFilterInput placeholder="От" value={displayPriceMin} onChange={setDisplayPriceMin} onConfirm={setPriceMin} />
                  <NumberFilterInput placeholder="До" value={displayPriceMax} onChange={setDisplayPriceMax} onConfirm={setPriceMax} />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Пробег, км</h3>
                <div className="flex gap-2">
                  <NumberFilterInput placeholder="От" value={displayMileageMin} onChange={setDisplayMileageMin} onConfirm={setMileageMin} />
                  <NumberFilterInput placeholder="До" value={displayMileageMax} onChange={setDisplayMileageMax} onConfirm={setMileageMax} />
                </div>
              </div>
              <SearchableMultiSelect label="Марка" options={ALL_BRANDS.map(b => ({ value: b as string, label: b }))} selected={selectedBrands} onToggle={toggleBrand} onClear={() => setSelectedBrands([])} placeholder="Все марки" />
              <div>
                <h3 className="font-semibold mb-2">Год выпуска</h3>
                <div className="flex gap-2">
                  <NumberFilterInput placeholder="От" value={displayYearMin} onChange={setDisplayYearMin} onConfirm={setYearMin} />
                  <NumberFilterInput placeholder="До" value={displayYearMax} onChange={setDisplayYearMax} onConfirm={setYearMax} />
                </div>
              </div>
              <SearchableMultiSelect label="Коробка передач" options={TRANSMISSIONS.map(([val, label]) => ({ value: val, label }))} selected={selectedTransmissions} onToggle={toggleTransmission} onClear={() => setSelectedTransmissions([])} placeholder="Любая" />
              <SearchableMultiSelect label="Тип топлива" options={FUELS.map(([val, label]) => ({ value: val as FuelType, label }))} selected={selectedFuels} onToggle={toggleFuel} onClear={() => setSelectedFuels([])} placeholder="Любой" />
              <SearchableMultiSelect label="Цвет" options={ALL_COLORS.map(c => ({ value: c, label: c }))} selected={selectedColors} onToggle={toggleColor} onClear={() => setSelectedColors([])} placeholder="Любой цвет" />
              <button onClick={resetFilters} className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">Сбросить все фильтры</button>
            </div>
          </aside>

          {/* Мобильные фильтры */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Фильтры</h2>
                  <button onClick={() => setMobileFiltersOpen(false)}><X className="w-6 h-6" /></button>
                </div>
                {/* ... (те же поля фильтров, что и в десктопе) ... */}
                <div>
                  <h3 className="font-semibold mb-2">Цена, ₽</h3>
                  <div className="flex gap-2">
                    <NumberFilterInput placeholder="От" value={displayPriceMin} onChange={setDisplayPriceMin} onConfirm={setPriceMin} />
                    <NumberFilterInput placeholder="До" value={displayPriceMax} onChange={setDisplayPriceMax} onConfirm={setPriceMax} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Пробег, км</h3>
                  <div className="flex gap-2">
                    <NumberFilterInput placeholder="От" value={displayMileageMin} onChange={setDisplayMileageMin} onConfirm={setMileageMin} />
                    <NumberFilterInput placeholder="До" value={displayMileageMax} onChange={setDisplayMileageMax} onConfirm={setMileageMax} />
                  </div>
                </div>
                <SearchableMultiSelect label="Марка" options={ALL_BRANDS.map(b => ({ value: b as string, label: b }))} selected={selectedBrands} onToggle={toggleBrand} onClear={() => setSelectedBrands([])} placeholder="Все марки" />
                <div>
                  <h3 className="font-semibold mb-2">Год выпуска</h3>
                  <div className="flex gap-2">
                    <NumberFilterInput placeholder="От" value={displayYearMin} onChange={setDisplayYearMin} onConfirm={setYearMin} />
                    <NumberFilterInput placeholder="До" value={displayYearMax} onChange={setDisplayYearMax} onConfirm={setYearMax} />
                  </div>
                </div>
                <SearchableMultiSelect label="Коробка передач" options={TRANSMISSIONS.map(([val, label]) => ({ value: val, label }))} selected={selectedTransmissions} onToggle={toggleTransmission} onClear={() => setSelectedTransmissions([])} placeholder="Любая" />
                <SearchableMultiSelect label="Тип топлива" options={FUELS.map(([val, label]) => ({ value: val as FuelType, label }))} selected={selectedFuels} onToggle={toggleFuel} onClear={() => setSelectedFuels([])} placeholder="Любой" />
                <SearchableMultiSelect label="Цвет" options={ALL_COLORS.map(c => ({ value: c, label: c }))} selected={selectedColors} onToggle={toggleColor} onClear={() => setSelectedColors([])} placeholder="Любой цвет" />
                <button onClick={resetFilters} className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">Сбросить все фильтры</button>
              </div>
            </div>
          )}

          {/* Список авто */}
          <div className="flex-1">
            {error && (
              <div className="text-center py-16">
                <p className="text-destructive text-lg mb-4">Ошибка загрузки: {error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Попробовать снова</button>
              </div>
            )}

            {loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-border overflow-hidden">
                    <div className="aspect-[4/3] bg-secondary animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-secondary rounded animate-pulse" />
                      <div className="h-4 bg-secondary rounded animate-pulse w-2/3" />
                      <div className="h-7 bg-secondary rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && adaptedCars.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adaptedCars.map(car => <CarCard key={car.id} car={car} />)}
              </div>
            )}

            {!loading && !error && adaptedCars.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  {searchQuery ? `По запросу «${searchQuery}» ничего не найдено` : 'По вашему запросу ничего не найдено'}
                </p>
                <button onClick={resetFilters} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Сбросить фильтры</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}