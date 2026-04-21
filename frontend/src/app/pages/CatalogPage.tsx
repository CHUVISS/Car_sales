import { useSearchParams } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import { CarCard } from '../components/CarCard';
import { getCars, getAllBrands, getAllColors } from '../data/mockData';
import { SlidersHorizontal, X } from 'lucide-react';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Фильтры
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isNew, setIsNew] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState('createdAt');

  const brands = getAllBrands();
  const colors = getAllColors();

  // Инициализация фильтров из URL
  useEffect(() => {
    const brand = searchParams.get('brand');
    if (brand) setSelectedBrands([brand]);
    
    const isNewParam = searchParams.get('isNew');
    if (isNewParam === 'true') setIsNew(true);
    if (isNewParam === 'false') setIsNew(false);
  }, [searchParams]);

  // Применение фильтров
  const filteredCars = useMemo(() => {
    let cars = getCars({
      brand: selectedBrands,
      price: {
        min: priceMin ? Number(priceMin) : 0,
        max: priceMax ? Number(priceMax) : Infinity
      },
      year: {
        min: yearMin ? Number(yearMin) : 0,
        max: yearMax ? Number(yearMax) : Infinity
      },
      transmission: selectedTransmissions,
      fuel: selectedFuels,
      isNew
    });

    // Фильтр по цвету
    if (selectedColors.length > 0) {
      cars = cars.filter(car => selectedColors.includes(car.color));
    }

    // Сортировка
    if (sortBy === 'priceAsc') {
      cars.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      cars.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'year') {
      cars.sort((a, b) => b.year - a.year);
    } else {
      cars.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return cars;
  }, [selectedBrands, priceMin, priceMax, yearMin, yearMax, selectedTransmissions, selectedFuels, selectedColors, isNew, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleTransmission = (transmission: string) => {
    setSelectedTransmissions(prev =>
      prev.includes(transmission) ? prev.filter(t => t !== transmission) : [...prev, transmission]
    );
  };

  const toggleFuel = (fuel: string) => {
    setSelectedFuels(prev =>
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const resetFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setSelectedBrands([]);
    setYearMin('');
    setYearMax('');
    setSelectedTransmissions([]);
    setSelectedFuels([]);
    setSelectedColors([]);
    setIsNew(undefined);
    setSearchParams({});
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Цена */}
      <div>
        <h3 className="font-semibold mb-3">Цена, ₽</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="До"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Марка */}
      <div>
        <h3 className="font-semibold mb-3">Марка</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Год выпуска */}
      <div>
        <h3 className="font-semibold mb-3">Год выпуска</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="До"
            value={yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Состояние */}
      <div>
        <h3 className="font-semibold mb-3">Состояние</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
            <input
              type="radio"
              checked={isNew === undefined}
              onChange={() => setIsNew(undefined)}
              className="w-4 h-4 text-primary border-border focus:ring-primary"
            />
            <span className="text-sm">Любое</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
            <input
              type="radio"
              checked={isNew === true}
              onChange={() => setIsNew(true)}
              className="w-4 h-4 text-primary border-border focus:ring-primary"
            />
            <span className="text-sm">Новые</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
            <input
              type="radio"
              checked={isNew === false}
              onChange={() => setIsNew(false)}
              className="w-4 h-4 text-primary border-border focus:ring-primary"
            />
            <span className="text-sm">С пробегом</span>
          </label>
        </div>
      </div>

      {/* Коробка передач */}
      <div>
        <h3 className="font-semibold mb-3">Коробка передач</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedTransmissions.includes('automatic')}
              onChange={() => toggleTransmission('automatic')}
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
            />
            <span className="text-sm">Автомат</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedTransmissions.includes('manual')}
              onChange={() => toggleTransmission('manual')}
              className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
            />
            <span className="text-sm">Механика</span>
          </label>
        </div>
      </div>

      {/* Тип топлива */}
      <div>
        <h3 className="font-semibold mb-3">Тип топлива</h3>
        <div className="space-y-2">
          {['petrol', 'diesel', 'electric', 'hybrid'].map(fuel => (
            <label key={fuel} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedFuels.includes(fuel)}
                onChange={() => toggleFuel(fuel)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
              />
              <span className="text-sm">
                {fuel === 'petrol' ? 'Бензин' : fuel === 'diesel' ? 'Дизель' : fuel === 'electric' ? 'Электро' : 'Гибрид'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Цвет */}
      <div>
        <h3 className="font-semibold mb-3">Цвет</h3>
        <div className="space-y-2">
          {colors.map(color => (
            <label key={color} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedColors.includes(color)}
                onChange={() => toggleColor(color)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
              />
              <span className="text-sm">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Сброс фильтров */}
      <button
        onClick={resetFilters}
        className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      >
        Сбросить все фильтры
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок и сортировка */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Каталог автомобилей</h1>
            <p className="text-muted-foreground">Найдено: {filteredCars.length} автомобилей</p>
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
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="createdAt">По дате добавления</option>
              <option value="priceAsc">По возрастанию цены</option>
              <option value="priceDesc">По убыванию цены</option>
              <option value="year">По году выпуска</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Фильтры (десктоп) */}
          <aside className={`hidden md:block w-64 flex-shrink-0 ${showFilters ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg border border-border p-6 sticky top-20">
              <FiltersContent />
            </div>
          </aside>

          {/* Мобильные фильтры */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Фильтры</h2>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <FiltersContent />
              </div>
            </div>
          )}

          {/* Список автомобилей */}
          <div className="flex-1">
            {filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map(car => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  По вашему запросу ничего не найдено
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
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
