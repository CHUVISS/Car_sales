import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { ChevronRight, Upload, X, CheckCircle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import {
  catalogApi,
  listingsApi,
  type CatalogMark,
  type CatalogModel,
  type CatalogGeneration,
  type CatalogConfiguration,
  type CatalogModification,
  type CatalogColor,
  type GeoCity,
} from '../api/catalog';

const CONDITION_OPTIONS: { value: string; label: string; desc: string }[] = [
  { value: 'excellent', label: 'Отличное', desc: 'Как новый, без дефектов' },
  { value: 'good', label: 'Хорошее', desc: 'Небольшие следы эксплуатации' },
  { value: 'fair', label: 'Удовлетворительное', desc: 'Заметные следы эксплуатации' },
  { value: 'poor', label: 'Плохое', desc: 'Требует ремонта' },
];

const inputCls = 'w-full px-4 py-2.5 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary border border-border focus:border-primary transition-colors';
const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

// Generic searchable select component
function SearchSelect<T extends { id: string }>({
  options,
  value,
  onChange,
  getLabel,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
}: {
  options: T[];
  value: string;
  onChange: (id: string, item: T) => void;
  getLabel: (item: T) => string;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.id === value);
  const filtered = q.trim()
    ? options.filter(o => getLabel(o).toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => { setOpen(o => !o); setQ(''); }}
        className={`${inputCls} flex items-center justify-between gap-2 text-left ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {loading ? 'Загрузка...' : selected ? getLabel(selected) : placeholder}
        </span>
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-muted-foreground" />
          : <ChevronRight className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
        }
      </button>

      {open && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
          {options.length > 6 && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-secondary rounded-md">
                <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={searchPlaceholder ?? 'Поиск...'}
                  className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
          <ul className="overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted-foreground text-center">Ничего не найдено</li>
            ) : (
              filtered.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(item.id, item); setOpen(false); setQ(''); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${item.id === value ? 'text-primary font-medium' : 'text-foreground'}`}
                  >
                    {getLabel(item)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const STEPS = ['Автомобиль', 'Данные', 'Фото и публикация'];
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — car selection
  const [marks, setMarks] = useState<CatalogMark[]>([]);
  const [markSearch, setMarkSearch] = useState('');
  const [marksLoading, setMarksLoading] = useState(false);
  const [selectedMark, setSelectedMark] = useState('');

  const [models, setModels] = useState<CatalogModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  const [generations, setGenerations] = useState<CatalogGeneration[]>([]);
  const [gensLoading, setGensLoading] = useState(false);
  const [selectedGen, setSelectedGen] = useState('');

  const [configurations, setConfigurations] = useState<CatalogConfiguration[]>([]);
  const [confsLoading, setConfsLoading] = useState(false);
  const [selectedConf, setSelectedConf] = useState('');

  const [modifications, setModifications] = useState<CatalogModification[]>([]);
  const [modsLoading, setModsLoading] = useState(false);
  const [selectedMod, setSelectedMod] = useState('');

  // Step 2 — details
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [condition, setCondition] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [vin, setVin] = useState('');
  const [description, setDescription] = useState('');

  const [colors, setColors] = useState<CatalogColor[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);

  // Step 3 — images
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Load marks on mount
  useEffect(() => {
    setMarksLoading(true);
    catalogApi.searchMarks('').then(setMarks).catch(() => setMarks([])).finally(() => setMarksLoading(false));
    catalogApi.getColors().then(setColors).catch(() => setColors([]));
    catalogApi.getPopularCities().then(setCities).catch(() => setCities([]));
  }, []);

  // Mark search debounce
  const markDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (markDebounce.current) clearTimeout(markDebounce.current);
    if (!markSearch.trim() && marks.length > 0) return;
    markDebounce.current = setTimeout(() => {
      setMarksLoading(true);
      catalogApi.searchMarks(markSearch).then(setMarks).catch(() => setMarks([])).finally(() => setMarksLoading(false));
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markSearch]);

  const handleMarkChange = (id: string) => {
    setSelectedMark(id);
    setSelectedModel(''); setModels([]);
    setSelectedGen(''); setGenerations([]);
    setSelectedConf(''); setConfigurations([]);
    setSelectedMod(''); setModifications([]);
    setModelsLoading(true);
    catalogApi.getModels(id).then(setModels).catch(() => setModels([])).finally(() => setModelsLoading(false));
  };

  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    setSelectedGen(''); setGenerations([]);
    setSelectedConf(''); setConfigurations([]);
    setSelectedMod(''); setModifications([]);
    setGensLoading(true);
    catalogApi.getGenerations(id).then(setGenerations).catch(() => setGenerations([])).finally(() => setGensLoading(false));
  };

  const handleGenChange = (id: string) => {
    setSelectedGen(id);
    setSelectedConf(''); setConfigurations([]);
    setSelectedMod(''); setModifications([]);
    setConfsLoading(true);
    catalogApi.getConfigurations(id).then(setConfigurations).catch(() => setConfigurations([])).finally(() => setConfsLoading(false));
  };

  const handleConfChange = (id: string) => {
    setSelectedConf(id);
    setSelectedMod(''); setModifications([]);
    setModsLoading(true);
    catalogApi.getModifications(id).then(setModifications).catch(() => setModifications([])).finally(() => setModsLoading(false));
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const next = [...images, ...files].slice(0, 10);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const handleImageRemove = (i: number) => {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!selectedMod || !year || !price || !mileage || !condition || !selectedColor || !selectedCity) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    setSubmitting(true);
    try {
      const listing = await listingsApi.create({
        modification_id: selectedMod,
        year: Number(year),
        price: Number(price),
        mileage: Number(mileage),
        condition: condition as 'excellent' | 'good' | 'fair' | 'poor',
        color_id: selectedColor,
        city_id: selectedCity,
        vin: vin.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (images.length > 0) {
        try {
          await listingsApi.uploadImages(listing.id, images);
        } catch {
          toast.error('Фото не удалось загрузить, но объявление создано');
        }
      }

      try {
        await listingsApi.publish(listing.id);
        toast.success('Объявление отправлено на модерацию!');
      } catch {
        toast.success('Объявление сохранено в черновиках');
      }

      navigate('/profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания объявления');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-semibold text-foreground mb-3">Войдите в аккаунт</h1>
          <p className="text-muted-foreground mb-6">Для создания объявления необходимо войти в систему</p>
          <Link to="/profile" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const genLabel = (gen: CatalogGeneration) => {
    const name = gen.name ?? '';
    const years = gen.year_from ? `${gen.year_from}–${gen.year_to ?? '...'}` : '';
    return [name, years].filter(Boolean).join(' · ');
  };

  const modLabel = (m: CatalogModification) => m.name ?? m.group_name ?? m.id;

  const canGoNext0 = Boolean(selectedMod);
  const canGoNext1 = Boolean(year && price && mileage && condition && selectedColor && selectedCity);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-semibold text-foreground mb-8">Подать объявление</h1>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors ${
                i < step ? 'bg-accent text-accent-foreground'
                  : i === step ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

          {/* Step 1: Car selection */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground mb-4">Выберите автомобиль</h2>

              <div>
                <label className={labelCls}>Марка *</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border border-border">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      value={markSearch}
                      onChange={e => setMarkSearch(e.target.value)}
                      placeholder="Поиск марки..."
                      className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {marksLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />}
                  </div>
                  <SearchSelect
                    options={marks}
                    value={selectedMark}
                    onChange={(id) => handleMarkChange(id)}
                    getLabel={(m) => m.cyrillic_name ?? m.name ?? m.id}
                    placeholder="Выберите марку"
                    loading={marksLoading}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Модель *</label>
                <SearchSelect
                  options={models}
                  value={selectedModel}
                  onChange={(id) => handleModelChange(id)}
                  getLabel={(m) => m.name ?? m.id}
                  placeholder={selectedMark ? 'Выберите модель' : 'Сначала выберите марку'}
                  disabled={!selectedMark || modelsLoading}
                  loading={modelsLoading}
                />
              </div>

              <div>
                <label className={labelCls}>Поколение *</label>
                <SearchSelect
                  options={generations}
                  value={selectedGen}
                  onChange={(id) => handleGenChange(id)}
                  getLabel={genLabel}
                  placeholder={selectedModel ? 'Выберите поколение' : 'Сначала выберите модель'}
                  disabled={!selectedModel || gensLoading}
                  loading={gensLoading}
                />
              </div>

              <div>
                <label className={labelCls}>Комплектация *</label>
                <SearchSelect
                  options={configurations}
                  value={selectedConf}
                  onChange={(id) => handleConfChange(id)}
                  getLabel={(c) => [c.name, c.body_type].filter(Boolean).join(', ') || c.id}
                  placeholder={selectedGen ? 'Выберите комплектацию' : 'Сначала выберите поколение'}
                  disabled={!selectedGen || confsLoading}
                  loading={confsLoading}
                />
              </div>

              <div>
                <label className={labelCls}>Модификация *</label>
                <SearchSelect
                  options={modifications}
                  value={selectedMod}
                  onChange={(id) => setSelectedMod(id)}
                  getLabel={modLabel}
                  placeholder={selectedConf ? 'Выберите модификацию' : 'Сначала выберите комплектацию'}
                  disabled={!selectedConf || modsLoading}
                  loading={modsLoading}
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground mb-4">Данные автомобиля</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Год выпуска *</label>
                  <input type="number" min="1900" max={new Date().getFullYear()} value={year}
                    onChange={e => setYear(e.target.value)} placeholder="2020" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Цена, ₽ *</label>
                  <input type="number" min="0" value={price}
                    onChange={e => setPrice(e.target.value)} placeholder="1 500 000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Пробег, км *</label>
                  <input type="number" min="0" value={mileage}
                    onChange={e => setMileage(e.target.value)} placeholder="50 000" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Состояние *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCondition(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        condition === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Цвет *</label>
                  <SearchSelect
                    options={colors}
                    value={selectedColor}
                    onChange={(id) => setSelectedColor(id)}
                    getLabel={(c) => c.name_ru}
                    placeholder="Выберите цвет"
                  />
                </div>
                <div>
                  <label className={labelCls}>Город *</label>
                  <SearchSelect
                    options={cities}
                    value={selectedCity}
                    onChange={(id) => setSelectedCity(id)}
                    getLabel={(c) => c.name_ru}
                    placeholder="Выберите город"
                    searchPlaceholder="Поиск города..."
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>VIN-номер</label>
                <input type="text" value={vin} onChange={e => setVin(e.target.value)}
                  placeholder="WBAXXXXXXXXXXXXXXX" maxLength={17} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Описание</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={4} placeholder="Расскажите об автомобиле подробнее..."
                  className={inputCls + ' resize-none'} />
              </div>
            </div>
          )}

          {/* Step 3: Photos & Publish */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Фотографии</h2>

              <div>
                <label className={labelCls}>Фото автомобиля (до 10 штук)</label>
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors group">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Нажмите для загрузки</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG — до 10 МБ каждый</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                </label>

                {previews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-secondary">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Главное</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                <p className="text-sm font-medium text-foreground mb-1">Что будет после отправки?</p>
                <p className="text-sm text-muted-foreground">
                  Объявление отправится на модерацию. После проверки оно появится в каталоге.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
              className="px-5 py-2.5 text-sm text-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              {step === 0 ? 'Отмена' : 'Назад'}
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !canGoNext0 : !canGoNext1}
                className="px-6 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Далее
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Публикация...' : 'Опубликовать'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
