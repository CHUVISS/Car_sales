import { useSearchParams } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { CarCard } from '../components/CarCard';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCars } from '../hooks/useCars';
import type { CarFilters, FuelType, Transmission } from '../api/cars';

const ALL_BRANDS = ['Audi', 'BMW', 'Hyundai', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen'];
const ALL_COLORS = ['Белый', 'Синий', 'Серый', 'Красный', 'Серебристый', 'Черный'];

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [isNew, setIsNew] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<CarFilters['sort_by']>('date_desc');

  useEffect(() => {
    const brand = searchParams.get('brand');
    if (brand) setSelectedBrands([brand]);
    const isNewParam = searchParams.get('isNew');
    if (isNewParam === 'true') setIsNew(true);
    if (isNewParam === 'false') setIsNew(false);
  }, [searchParams]);

  const filters: CarFilters = useMemo(() => {
    const f: CarFilters = { sort_by: sortBy, limit: 100 };
    if (selectedBrands.length === 1) f.brand = selectedBrands[0];
    if (priceMin) f.price_from = Number(priceMin);
    if (priceMax) f.price_to = Number(priceMax);
    if (yearMin) f.year_from = Number(yearMin);
    if (yearMax) f.year_to = Number(yearMax);
    if (selectedTransmissions.length === 1) f.transmission = selectedTransmissions[0] as Transmission;
    if (selectedFuels.length === 1) f.fuel_type = selectedFuels[0] as FuelType;
    if (isNew === true) f.status = 'available';
    return f;
  }, [selectedBrands, priceMin, priceMax, yearMin, yearMax, selectedTransmissions, selectedFuels, isNew, sortBy]);

  const { cars, count, loading, error } = useCars(filters);

  const toggleBrand = (brand: string) =>
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  const toggleTransmission = (t: string) =>
    setSelectedTransmissions(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleFuel = (f: string) =>
    setSelectedFuels(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const resetFilters = () => {
    setPriceMin(''); setPriceMax('');
    setSelectedBrands([]); setYearMin(''); setYearMax('');
    setSelectedTransmissions([]); setSelectedFuels([]);
    setIsNew(undefined); setSearchParams({});
  };

  // Адаптер: Car из API → формат CarCard
  const adaptedCars = cars.map(car => ({
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    price: Number(car.price),
    mileage: car.mileage,
    transmission: (car.transmission === 'automatic' || car.transmission === 'robot' || car.transmission === 'variator') ? 'automatic' as const : 'manual' as const,
    fuel: (car.fuel_type ?? 'petrol') as 'petrol' | 'diesel' | 'electric' | 'hybrid',
    color: car.color ?? '',
    engineVolume: Number(car.engine_volume ?? 0),
    drive: 'front' as const,
    body: (car.body_type ?? 'sedan') as 'sedan' | 'suv' | 'hatchback' | 'wagon' | 'coupe' | 'minivan',
    power: car.engine_power ?? 0,
    images: car.images.length > 0
      ? car.images.map(img => img.url)
      : ['placeholder'],
    description: car.description ?? '',
    isNew: car.status === 'available' && car.mileage === 0,
    createdAt: car.created_at,
    vin: car.vin ?? undefined,
  }));

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Цена, ₽</h3>
        <div className="flex gap-2">
          <input type="number" placeholder="От" value={priceMin} onChange={e => setPriceMin(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          <input type="number" placeholder="До" value={priceMax} onChange={e => setPriceMax(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Марка</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {ALL_BRANDS.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
              <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary" />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Год выпуска</h3>
        <div className="flex gap-2">
          <input type="number" placeholder="От" value={yearMin} onChange={e => setYearMin(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
          <input type="number" placeholder="До" value={yearMax} onChange={e => setYearMax(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Коробка передач</h3>
        <div className="space-y-2">
          {[['automatic', 'Автомат'], ['manual', 'Механика']].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
              <input type="checkbox" checked={selectedTransmissions.includes(val)} onChange={() => toggleTransmission(val)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Тип топлива</h3>
        <div className="space-y-2">
          {[['petrol', 'Бензин'], ['diesel', 'Дизель'], ['electric', 'Электро'], ['hybrid', 'Гибрид']].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
              <input type="checkbox" checked={selectedFuels.includes(val)} onChange={() => toggleFuel(val)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={resetFilters} className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
        Сбросить все фильтры
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Каталог автомобилей</h1>
            <p className="text-muted-foreground">
              {loading ? 'Загрузка...' : `Найдено: ${count} автомобилей`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
              <SlidersHorizontal className="w-5 h-5" />
              <span>Фильтры</span>
            </button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as CarFilters['sort_by'])}
              className="px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary">
              <option value="date_desc">По дате добавления</option>
              <option value="price_asc">По возрастанию цены</option>
              <option value="price_desc">По убыванию цены</option>
              <option value="year_desc">По году выпуска</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-border p-6 sticky top-20">
              <FiltersContent />
            </div>
          </aside>

          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Фильтры</h2>
                  <button onClick={() => setMobileFiltersOpen(false)}><X className="w-6 h-6" /></button>
                </div>
                <FiltersContent />
              </div>
            </div>
          )}

          <div className="flex-1">
            {error && (
              <div className="text-center py-16">
                <p className="text-destructive text-lg mb-4">Ошибка загрузки: {error}</p>
                <button onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  Попробовать снова
                </button>
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
                {adaptedCars.map(car => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}

            {!loading && !error && adaptedCars.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">По вашему запросу ничего не найдено</p>
                <button onClick={resetFilters}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}