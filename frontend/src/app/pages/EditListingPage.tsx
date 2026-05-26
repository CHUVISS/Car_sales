import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { listingsApi, catalogApi, type CatalogColor, type GeoCity } from '../api/catalog';
import { formatCatalogId } from '../api/cars';

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Отличное', desc: 'Как новый, без дефектов' },
  { value: 'good', label: 'Хорошее', desc: 'Небольшие следы эксплуатации' },
  { value: 'fair', label: 'Удовлетворительное', desc: 'Заметные следы эксплуатации' },
  { value: 'poor', label: 'Плохое', desc: 'Требует ремонта' },
];

const inputCls = 'w-full px-4 py-2.5 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary border border-border focus:border-primary transition-colors';
const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [markLabel, setMarkLabel] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [condition, setCondition] = useState('');
  const [colorId, setColorId] = useState('');
  const [cityId, setCityId] = useState('');
  const [vin, setVin] = useState('');
  const [description, setDescription] = useState('');

  const [colors, setColors] = useState<CatalogColor[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      listingsApi.get(id),
      catalogApi.getColors(),
      catalogApi.getPopularCities(),
    ]).then(([listing, cols, cts]) => {
      setMarkLabel(`${formatCatalogId(listing.mark_id)} ${formatCatalogId(listing.model_id)}`);
      setYear(String(listing.year));
      setPrice(String(listing.price));
      setMileage(String(listing.mileage));
      setCondition(listing.condition ?? '');
      setColorId(listing.color_id ?? '');
      setCityId(listing.city_id ?? '');
      setVin(listing.vin ?? '');
      setDescription(listing.description ?? '');
      setColors(cols);
      setCities(cts);
    }).catch(() => {
      toast.error('Не удалось загрузить объявление');
      navigate('/profile?tab=drafts');
    }).finally(() => setPageLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await listingsApi.update(id, {
        year: Number(year),
        price: Number(price),
        mileage: Number(mileage),
        condition: condition as 'excellent' | 'good' | 'fair' | 'poor',
        color_id: colorId || undefined,
        city_id: cityId || undefined,
        vin: vin.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success('Изменения сохранены');
      navigate('/profile?tab=drafts');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Редактировать объявление</h1>
        <p className="text-muted-foreground mb-8">{markLabel} · {year}</p>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Год выпуска</label>
              <input type="number" min="1900" max={new Date().getFullYear()} value={year}
                onChange={e => setYear(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Цена, ₽</label>
              <input type="text" inputMode="numeric"
                value={price.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="1 500 000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Пробег, км</label>
              <input type="text" inputMode="numeric"
                value={mileage.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                onChange={e => setMileage(e.target.value.replace(/\D/g, ''))}
                placeholder="50 000" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Состояние</label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setCondition(opt.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${condition === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/30'}`}>
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Цвет</label>
              <select value={colorId} onChange={e => setColorId(e.target.value)}
                className={inputCls + ' appearance-none cursor-pointer'}>
                <option value="">Не указан</option>
                {colors.map(c => <option key={c.id} value={c.id}>{c.name_ru}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Город</label>
              <select value={cityId} onChange={e => setCityId(e.target.value)}
                className={inputCls + ' appearance-none cursor-pointer'}>
                <option value="">Не указан</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name_ru}</option>)}
              </select>
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

          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => navigate('/profile?tab=drafts')}
              className="px-5 py-2.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
