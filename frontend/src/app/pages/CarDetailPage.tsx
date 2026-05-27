import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Heart, Share2, Phone, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { useCar } from '../hooks/useCars';
import { useFavorites } from '../hooks/useFavorites';
import { useSalonInfo } from '../hooks/useSalonInfo';
import { viewingsApi, type ViewingWindow } from '../api/viewings';
import { reservationsApi } from '../api/reservations';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
}
function formatMileage(m: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(m)} км`;
}
const TRANSMISSION_LABELS: Record<string, string> = { manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор' };
const FUEL_LABELS: Record<string, string> = { petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид', gas: 'Газ' };
const BODY_LABELS: Record<string, string> = { sedan: 'Седан', suv: 'Внедорожник', hatchback: 'Хэтчбек', wagon: 'Универсал', coupe: 'Купе', minivan: 'Минивэн', convertible: 'Кабриолет', pickup: 'Пикап' };

const STATUS_LABELS: Record<string, string> = { available: 'В наличии', reserved: 'Зарезервирован', sold: 'Продан', inactive: 'Снят с продажи' };
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-accent/15 text-accent border-accent/30',
  reserved: 'bg-primary/10 text-primary border-primary/30',
  sold: 'bg-muted text-muted-foreground border-border',
  inactive: 'bg-muted text-muted-foreground border-border',
};
const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Отличное состояние', good: 'Хорошее состояние', fair: 'Удовлетворительное состояние', poor: 'Плохое состояние',
};
const CONDITION_DESCS: Record<string, string> = {
  excellent: 'Как новый, без дефектов',
  good: 'Небольшие следы эксплуатации',
  fair: 'Заметные следы эксплуатации',
  poor: 'Требует ремонта',
};
const CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-accent/15 text-accent border-accent/30',
  good: 'bg-primary/10 text-primary border-primary/30',
  fair: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  poor: 'bg-destructive/10 text-destructive border-destructive/30',
};

/** Группирует окна просмотра по дате */
function groupWindowsByDate(windows: ViewingWindow[]): Record<string, ViewingWindow[]> {
  return windows.reduce<Record<string, ViewingWindow[]>>((acc, w) => {
    const d = w.window_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(w);
    return acc;
  }, {});
}

function formatWindowDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { car, loading, error } = useCar(id);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const salonInfo = useSalonInfo();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Окна просмотра
  const [windows, setWindows] = useState<ViewingWindow[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(false);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  // Состояние резервации
  const [reserving, setReserving] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [reservationDone, setReservationDone] = useState(false);

  // Загружаем окна просмотра когда открывается панель
  useEffect(() => {
    if (!showBookingPanel || !id) return;
    setWindowsLoading(true);
    viewingsApi
      .getAvailableSlots(id)
      .then((data) => setWindows(data.filter((w) => w.is_available)))
      .catch(() => setWindows([]))
      .finally(() => setWindowsLoading(false));
  }, [showBookingPanel, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-foreground">Автомобиль не найден</h1>
          <Link to="/catalog" className="text-primary hover:underline">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  const favorite = isFavorite(car.id);
  const carImages = car.images.length > 0
    ? car.images.sort((a, b) => a.sort_order - b.sort_order).map(img => img.url)
    : ['https://images.unsplash.com/photo-1621007947622-7c9b888c6cc1?w=1200&q=80'];

  const prevSlide = () => setActiveSlide(p => p === 0 ? carImages.length - 1 : p - 1);
  const nextSlide = () => setActiveSlide(p => p === carImages.length - 1 ? 0 : p + 1);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${car.brand} ${car.model} ${car.year}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* отменено */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована в буфер обмена');
      } catch {
        toast.error('Не удалось скопировать ссылку');
      }
    }
  };

  const handleReserve = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Для бронирования необходимо войти в аккаунт');
      return;
    }
    setReserving(true);
    try {
      // 1. Создаём резервацию
      const res = await reservationsApi.reserve(car.id);

      // 2. Если выбрано окно — сразу бронируем
      if (selectedWindowId) {
        try {
          await reservationsApi.bookViewing(res.reservation_id, selectedWindowId);
        } catch {
          // Не критично — запишемся позже из профиля
          toast.info('Бронь создана, выберите время просмотра в личном кабинете');
        }
      }

      if (res.payment_url) {
        setPaymentUrl(res.payment_url);
      } else {
        setReservationDone(true);
        toast.success('Бронирование успешно создано!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка бронирования';
      if (msg.includes('already reserved') || msg.includes('already reserved')) {
        toast.error('Этот автомобиль уже зарезервирован');
      } else {
        toast.error(msg);
      }
    } finally {
      setReserving(false);
    }
  };

  const groupedWindows = groupWindowsByDate(windows);
  const sortedDates = Object.keys(groupedWindows).sort();

  const specs = [
    ['Марка', car.brand], ['Модель', car.model], ['Год выпуска', String(car.year)],
    ['Пробег', formatMileage(car.mileage)],
    ...(car.condition ? [['Состояние', CONDITION_LABELS[car.condition] ?? car.condition]] : []),
    ...(car.body_type ? [['Тип кузова', BODY_LABELS[car.body_type] ?? car.body_type]] : []),
    ...(car.color ? [['Цвет', car.color]] : []),
    ...(car.engine_volume ? [['Двигатель', `${car.engine_volume} л`]] : []),
    ...(car.engine_power ? [['Мощность', `${car.engine_power} л.с.`]] : []),
    ...(car.fuel_type ? [['Тип топлива', FUEL_LABELS[car.fuel_type] ?? car.fuel_type]] : []),
    ...(car.transmission ? [['Коробка передач', TRANSMISSION_LABELS[car.transmission] ?? car.transmission]] : []),
    ...(car.vin ? [['VIN', car.vin]] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Галерея */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="relative aspect-[16/9]">
                <ImageWithFallback src={carImages[activeSlide]}
                  alt={`${car.brand} ${car.model} — фото ${activeSlide + 1}`}
                  className={`w-full h-full object-cover ${car.status === 'sold' || car.status === 'inactive' ? 'brightness-75' : ''}`} />
                {(car.status === 'sold' || car.status === 'inactive') && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="px-6 py-3 bg-black/60 text-white text-xl font-bold rounded-xl tracking-wide backdrop-blur-sm border border-white/20">
                      {STATUS_LABELS[car.status]}
                    </span>
                  </div>
                )}
                {carImages.length > 1 && (
                  <>
                    <button onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 hover:bg-card rounded-full flex items-center justify-center shadow transition-colors border border-border">
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <button onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 hover:bg-card rounded-full flex items-center justify-center shadow transition-colors border border-border">
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {carImages.map((_, i) => (
                        <button key={i} onClick={() => setActiveSlide(i)}
                          className={`w-10 h-1 rounded-full transition-colors ${i === activeSlide ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {carImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-card">
                  {carImages.map((src, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${i === activeSlide ? 'border-primary' : 'border-border'}`}>
                      <ImageWithFallback src={src} alt={`Миниатюра ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Заголовок */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-3xl font-semibold text-foreground">{car.brand} {car.model}</h1>
                    {car.mileage === 0 && (
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">Новый</span>
                    )}
                    {car.status && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[car.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {STATUS_LABELS[car.status] ?? car.status}
                      </span>
                    )}
                    {car.condition && (
                      <span className="relative group cursor-default">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${CONDITION_COLORS[car.condition] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {CONDITION_LABELS[car.condition] ?? car.condition}
                        </span>
                        {CONDITION_DESCS[car.condition] && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none z-20 opacity-0 scale-95 -translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 ease-out">
                            <span className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-xl border text-xs font-medium whitespace-nowrap backdrop-blur-sm ${CONDITION_COLORS[car.condition] ?? 'bg-popover text-popover-foreground border-border'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                              {CONDITION_DESCS[car.condition]}
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-current opacity-30" />
                            </span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{car.year} год • {formatMileage(car.mileage)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(car.id)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors border border-border"
                    title={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    <Heart className={`w-6 h-6 transition-colors ${favorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors border border-border"
                    title="Поделиться"
                  >
                    <Share2 className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="text-4xl font-semibold text-primary mb-6">{formatPrice(Number(car.price))}</div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['Год', String(car.year)],
                  ['Пробег', formatMileage(car.mileage)],
                  ['Двигатель', car.engine_volume ? `${car.engine_volume}л` : '—'],
                  ['Мощность', car.engine_power ? `${car.engine_power} л.с.` : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Характеристики */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Характеристики</h2>
              <div className="space-y-3">
                {specs.map(([label, value], i) => (
                  <div key={label} className={`flex justify-between py-3 ${i < specs.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {car.description && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Описание</h2>
                <p className="text-muted-foreground leading-relaxed">{car.description}</p>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Действия</h3>
                {car.status && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[car.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {STATUS_LABELS[car.status] ?? car.status}
                  </span>
                )}
              </div>

              {(car.status === 'sold' || car.status === 'inactive') ? (
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="font-semibold text-foreground mb-1">
                    {car.status === 'sold' ? 'Автомобиль продан' : 'Снят с продажи'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {car.status === 'sold'
                      ? 'Этот автомобиль уже нашёл своего владельца'
                      : 'Автомобиль временно недоступен для покупки'}
                  </p>
                </div>
              ) : reservationDone ? (
                <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30 text-center">
                  <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="font-semibold text-foreground mb-1">Бронирование оформлено!</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Детали в разделе «Мои записи» личного кабинета
                  </p>
                  <Link to="/profile?tab=reservations"
                    className="text-sm text-primary hover:underline">
                    Перейти в кабинет →
                  </Link>
                </div>
              ) : paymentUrl ? (
                <div className="mb-6 space-y-3">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-1">Бронь создана!</p>
                    <p className="text-xs text-muted-foreground">
                      Внесите депозит для подтверждения. Он будет возвращён после просмотра.
                    </p>
                  </div>
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <CreditCard className="w-5 h-5" />
                    Оплатить депозит
                  </a>
                  <button
                    onClick={() => { setPaymentUrl(null); setShowBookingPanel(false); }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Сделать позже
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { window.location.href = 'tel:+79001234567'; }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Позвонить</span>
                  </button>
                  <button
                    onClick={() => setShowBookingPanel(!showBookingPanel)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg transition-opacity ${
                      car.status === 'reserved'
                        ? 'bg-primary/60 text-primary-foreground cursor-default'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                    disabled={car.status === 'reserved'}
                    title={car.status === 'reserved' ? 'Автомобиль зарезервирован' : undefined}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>{car.status === 'reserved' ? 'Зарезервирован' : 'Записаться на просмотр'}</span>
                  </button>
                </div>
              )}

              {/* Форма бронирования */}
              {showBookingPanel && !paymentUrl && !reservationDone && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Выберите удобное время</h4>

                  {windowsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : windows.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Продавец не указал время просмотра.
                        Вы всё равно можете создать бронь.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-3 max-h-52 overflow-y-auto pr-1">
                      {sortedDates.map((date) => (
                        <div key={date}>
                          <p className="text-xs text-muted-foreground mb-1.5">{formatWindowDate(date)}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {groupedWindows[date].map((w) => (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => setSelectedWindowId(selectedWindowId === w.id ? null : w.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                                  selectedWindowId === w.id
                                    ? 'border-primary bg-primary/5 text-primary font-medium'
                                    : 'border-border hover:border-foreground/30 text-foreground'
                                }`}
                              >
                                {w.time_from.slice(0, 5)}–{w.time_to.slice(0, 5)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 mb-3 rounded-lg bg-secondary/60 border border-border text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-0.5">Как работает бронирование?</p>
                    <p>Будет удержан небольшой депозит, который вернётся после просмотра независимо от результата.</p>
                  </div>

                  <button
                    onClick={handleReserve}
                    disabled={reserving}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {reserving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Создаём бронь...</>
                      : <><CreditCard className="w-4 h-4" /> Забронировать{selectedWindowId ? '' : ' без времени'}</>
                    }
                  </button>
                </div>
              )}

              {/* Продавец */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Продавец</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg font-semibold">МД</div>
                  <div>
                    <p className="font-semibold text-foreground">Матвей Дворников</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Осмотр автомобиля</h4>
                {salonInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        {salonInfo.working_hours.map(wh => (
                          <div key={wh.days} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground w-16 flex-shrink-0">{wh.days}</span>
                            <span className="font-medium text-foreground">{wh.hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      {salonInfo.map_url ? (
                        <a href={salonInfo.map_url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline">{salonInfo.address}</a>
                      ) : (
                        <span className="text-sm text-foreground">{salonInfo.address}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
