import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { listingsApi, catalogApi, type CatalogColor, type GeoCity } from '../api/catalog';
import { viewingsApi } from '../api/viewings';
import { formatCatalogId } from '../api/cars';

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Отличное',        desc: 'Как новый, без дефектов' },
  { value: 'good',      label: 'Хорошее',         desc: 'Небольшие следы эксплуатации' },
  { value: 'fair',      label: 'Удовлетворительное', desc: 'Заметные следы эксплуатации' },
  { value: 'poor',      label: 'Плохое',           desc: 'Требует ремонта' },
];

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

const inputCls = 'w-full px-4 py-2.5 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary border border-border focus:border-primary transition-colors';
const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Отображаемый заголовок
  const [markLabel, setMarkLabel] = useState('');

  // Основные поля
  const [year, setYear]           = useState('');
  const [price, setPrice]         = useState('');
  const [mileage, setMileage]     = useState('');
  const [condition, setCondition] = useState('');
  const [colorId, setColorId]     = useState('');
  const [cityId, setCityId]       = useState('');
  const [vin, setVin]             = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [description, setDescription]  = useState('');

  // Контакт / сделка
  const [saleAddress, setSaleAddress]       = useState('');
  const [acceptsCash, setAcceptsCash]       = useState(false);
  const [acceptsTransfer, setAcceptsTransfer] = useState(false);

  // Просмотры
  const [viewingEnabled, setViewingEnabled] = useState(false);
  const [viewingDays, setViewingDays]       = useState<number[]>([]);
  const [viewingFrom, setViewingFrom]       = useState('10:00');
  const [viewingTo, setViewingTo]           = useState('18:00');

  // Справочники
  const [colors, setColors] = useState<CatalogColor[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);

  const toggleDay = (i: number) =>
    setViewingDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      listingsApi.get(id),
      catalogApi.getColors(),
      catalogApi.getPopularCities(),
      viewingsApi.getAvailableSlots(id).catch(() => []),
    ]).then(([listing, cols, cts, windows]) => {
      // Заголовок
      setMarkLabel(`${formatCatalogId(listing.mark_id)} ${formatCatalogId(listing.model_id)}`);

      // Основные поля
      setYear(String(listing.year));
      setPrice(String(listing.price));
      setMileage(String(listing.mileage));
      setCondition(listing.condition ?? '');
      setColorId(listing.color_id ?? '');
      setCityId(listing.city_id ?? '');
      setVin(listing.vin ?? '');
      setLicensePlate(listing.license_plate ?? '');
      setDescription(listing.description ?? '');

      // Контакт / сделка
      setSaleAddress(listing.sale_address ?? '');
      setAcceptsCash(listing.accepts_cash ?? false);
      setAcceptsTransfer(listing.accepts_transfer ?? false);

      // Просмотры
      const viewEnabled = listing.viewing_enabled ?? false;
      setViewingEnabled(viewEnabled);

      if (viewEnabled && windows.length > 0) {
        // Извлекаем уникальные дни недели из существующих окон
        // JS: 0=Вс, 1=Пн..6=Сб → наш формат: 0=Пн..6=Вс → (jsDay + 6) % 7
        const days = [...new Set(
          windows.map(w => (new Date(w.window_date).getDay() + 6) % 7)
        )].sort();
        setViewingDays(days);

        // Время из первого окна
        if (windows[0]) {
          setViewingFrom(windows[0].time_from.slice(0, 5));
          setViewingTo(windows[0].time_to.slice(0, 5));
        }
      }

      setColors(cols);
      setCities(cts);
    }).catch(() => {
      toast.error('Не удалось загрузить объявление');
      navigate('/profile?tab=drafts');
    }).finally(() => setPageLoading(false));
  }, [id]);

  const hasIdentifier = vin.trim().length === 17 || licensePlate.trim().length > 0;
  const canSubmit = Boolean(
    year && price && mileage && condition && colorId && cityId && hasIdentifier
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !canSubmit) return;
    setSubmitting(true);
    try {
      await listingsApi.update(id, {
        year:             Number(year),
        price:            Number(price),
        mileage:          Number(mileage),
        condition:        condition as 'excellent' | 'good' | 'fair' | 'poor',
        color_id:         colorId,
        city_id:          cityId,
        vin:              vin.trim() || undefined,
        license_plate:    licensePlate.trim() || undefined,
        description:      description.trim() || undefined,
        sale_address:     saleAddress.trim() || undefined,
        accepts_cash:     acceptsCash,
        accepts_transfer: acceptsTransfer,
        viewing_enabled:  viewingEnabled,
      });

      // Расписание просмотров
      if (viewingEnabled && viewingDays.length > 0) {
        await viewingsApi.setSchedule(id, {
          template: viewingDays.map(d => ({
            weekday:   d,
            time_from: viewingFrom,
            time_to:   viewingTo,
          })),
          repeat_weekly: true,
        });
      }

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

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">

          {/* Год / Цена / Пробег */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Год выпуска *</label>
              <input type="number" min="1900" max={new Date().getFullYear()} value={year}
                onChange={e => setYear(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Цена, ₽ *</label>
              <input type="text" inputMode="numeric"
                value={price.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="1 500 000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Пробег, км *</label>
              <input type="text" inputMode="numeric"
                value={mileage.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                onChange={e => setMileage(e.target.value.replace(/\D/g, ''))}
                placeholder="50 000" className={inputCls} />
            </div>
          </div>

          {/* Состояние */}
          <div>
            <label className={labelCls}>Состояние *</label>
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

          {/* Цвет / Город */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Цвет *</label>
              <select value={colorId} onChange={e => setColorId(e.target.value)}
                className={inputCls + ' appearance-none cursor-pointer'}>
                <option value="">Выберите цвет</option>
                {colors.map(c => <option key={c.id} value={c.id}>{c.name_ru}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Город *</label>
              <select value={cityId} onChange={e => setCityId(e.target.value)}
                className={inputCls + ' appearance-none cursor-pointer'}>
                <option value="">Выберите город</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name_ru}</option>)}
              </select>
            </div>
          </div>

          {/* VIN / Госномер */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>VIN-номер</label>
              <input type="text" value={vin}
                onChange={e => setVin(e.target.value.toUpperCase())}
                placeholder="WBAXXXXXXXXXXXXXXX" maxLength={17} className={inputCls} />
              {vin.length > 0 && vin.length < 17 && (
                <p className="text-xs text-destructive mt-1">17 символов ({vin.length}/17)</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Госномер</label>
              <input type="text" value={licensePlate}
                onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="А123БВ77" className={inputCls} />
            </div>
          </div>
          {!hasIdentifier && (
            <p className="text-xs text-destructive -mt-4">Укажите VIN или госномер *</p>
          )}

          {/* Адрес сделки */}
          <div>
            <label className={labelCls}>Адрес для сделки / осмотра</label>
            <input type="text" value={saleAddress}
              onChange={e => setSaleAddress(e.target.value)}
              placeholder="г. Москва, ул. Автомобильная, д. 1"
              className={inputCls} />
          </div>

          {/* Способы оплаты */}
          <div>
            <label className={labelCls}>Способы оплаты</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setAcceptsCash(p => !p)}
                  className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 cursor-pointer ${acceptsCash ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${acceptsCash ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-foreground">Наличные</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setAcceptsTransfer(p => !p)}
                  className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 cursor-pointer ${acceptsTransfer ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${acceptsTransfer ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-foreground">Безналичный перевод</span>
              </label>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className={labelCls}>Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4} placeholder="Расскажите об автомобиле подробнее..."
              className={inputCls + ' resize-none'} />
          </div>

          {/* Просмотры */}
          <div className="pt-2 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Просмотры</p>
                <p className="text-xs text-muted-foreground">Разрешить покупателям записываться на осмотр</p>
              </div>
              <div
                onClick={() => setViewingEnabled(p => !p)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${viewingEnabled ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${viewingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>

            {viewingEnabled && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Дни недели</p>
                  <div className="flex gap-1.5">
                    {WEEK_DAYS.map((day, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(i)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${viewingDays.includes(i) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-foreground/30 text-foreground'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                {viewingDays.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">С</label>
                      <select value={viewingFrom} onChange={e => setViewingFrom(e.target.value)}
                        className={inputCls + ' appearance-none cursor-pointer'}>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">До</label>
                      <select value={viewingTo} onChange={e => setViewingTo(e.target.value)}
                        className={inputCls + ' appearance-none cursor-pointer'}>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => navigate('/profile?tab=drafts')}
              className="px-5 py-2.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={submitting || !canSubmit}
              className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
