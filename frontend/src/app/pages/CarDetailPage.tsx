import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Heart, Share2, Phone, Calendar, Check, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { useCar } from '../hooks/useCars';
import { useFavorites } from '../hooks/useFavorites';
import { useSalonInfo } from '../hooks/useSalonInfo';
import { viewingsApi } from '../api/viewings';

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

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { car, loading, error } = useCar(id);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const salonInfo = useSalonInfo();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const [submitting, setSubmitting] = useState(false);

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
      try {
        await navigator.share({ title, url });
      } catch {
        // пользователь отменил — ничего не делаем
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована в буфер обмена');
      } catch {
        toast.error('Не удалось скопировать ссылку');
      }
    }
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Для записи на просмотр необходимо войти в аккаунт');
      return;
    }
    setSubmitting(true);
    try {
      await viewingsApi.book({ car_id: car.id });
      toast.success('Заявка на просмотр отправлена! Продавец свяжется с вами.');
      setShowAppointmentForm(false);
    } catch {
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  const specs = [
    ['Марка', car.brand], ['Модель', car.model], ['Год выпуска', String(car.year)],
    ['Пробег', formatMileage(car.mileage)],
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
                <h3 className="font-semibold text-foreground">Свяжитесь с нами</h3>
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
                    onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg transition-opacity ${car.status === 'reserved' ? 'bg-primary/60 text-primary-foreground cursor-default' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                    disabled={car.status === 'reserved'}
                    title={car.status === 'reserved' ? 'Автомобиль зарезервирован' : undefined}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>{car.status === 'reserved' ? 'Зарезервирован' : 'Записаться на просмотр'}</span>
                  </button>
                </div>
              )}

              {showAppointmentForm && (
                <form className="space-y-3 pt-4 border-t border-border" onSubmit={handleAppointmentSubmit}>
                  <p className="text-sm text-muted-foreground">
                    Отправьте заявку на просмотр — продавец свяжется с вами для уточнения даты и времени.
                  </p>
                  <button type="submit" disabled={submitting}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
                    {submitting ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Менеджер</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg font-semibold">АИ</div>
                  <div>
                    <p className="font-semibold text-foreground">Алексей Иванов</p>
                    <p className="text-sm text-muted-foreground">Менеджер по продажам</p>
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

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Гарантии</h4>
                <div className="space-y-2">
                  {['Проверка юридической чистоты', 'Техническая диагностика', 'Гарантия на автомобиль', 'Помощь в оформлении'].map(text => (
                    <div key={text} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}