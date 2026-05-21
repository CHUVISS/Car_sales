import { useParams, Link } from 'react-router';
import { ArrowLeft, Heart, Share2, Phone, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { useCar } from '../hooks/useCars';
import { messagesApi } from '../api/messages';
import { viewingsApi } from '../api/viewings';
import { useFavorites } from '../hooks/useFavorites';


function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
}
function formatMileage(m: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(m)} км`;
}
const TRANSMISSION_LABELS: Record<string, string> = { manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор' };
const FUEL_LABELS: Record<string, string> = { petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид', gas: 'Газ' };
const BODY_LABELS: Record<string, string> = { sedan: 'Седан', suv: 'Внедорожник', hatchback: 'Хэтчбек', wagon: 'Универсал', coupe: 'Купе', minivan: 'Минивэн', convertible: 'Кабриолет', pickup: 'Пикап' };

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { car, loading, error } = useCar(id);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const { isFavorite: checkFav, toggle: toggleFavorite } = useFavorites();
  const isFavorite = checkFav(car?.id ?? '');
  const [activeSlide, setActiveSlide] = useState(0);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formComment, setFormComment] = useState('');
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
          <h1 className="text-2xl font-semibold mb-4">Автомобиль не найден</h1>
          <Link to="/catalog" className="text-primary hover:underline">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  const carImages = car.images.length > 0
    ? car.images.sort((a, b) => a.sort_order - b.sort_order).map(img => img.url)
    : ['https://images.unsplash.com/photo-1621007947622-7c9b888c6cc1?w=1200&q=80'];

  const prevSlide = () => setActiveSlide(prev => prev === 0 ? carImages.length - 1 : prev - 1);
  const nextSlide = () => setActiveSlide(prev => prev === carImages.length - 1 ? 0 : prev + 1);

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (token && formDate && formTime) {
        try {
          await viewingsApi.book({ car_id: car.id, viewing_date: formDate, viewing_time: formTime, comment: formComment || undefined });
          toast.success('Запись на просмотр успешно создана!');
        } catch {
          await messagesApi.send({
            name: formName, email: 'noreply@autosalon.ru', phone: formPhone,
            subject: `Запись на просмотр: ${car.brand} ${car.model}`,
            body: `Клиент ${formName} (${formPhone}) хочет записаться на просмотр ${car.brand} ${car.model} ${car.year}. Дата: ${formDate} ${formTime}. ${formComment}`,
            message_type: 'callback', car_id: car.id,
          });
          toast.success('Заявка на просмотр отправлена!');
        }
      } else {
        await messagesApi.send({
          name: formName, email: 'noreply@autosalon.ru', phone: formPhone,
          subject: `Запись на просмотр: ${car.brand} ${car.model}`,
          body: `Клиент ${formName} (${formPhone}) хочет записаться. Дата: ${formDate} ${formTime}. ${formComment}`,
          message_type: 'callback', car_id: car.id,
        });
        toast.success('Заявка на просмотр отправлена!');
      }
      setShowAppointmentForm(false);
      setFormName(''); setFormPhone(''); setFormDate(''); setFormComment('');
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
        <Link to="/catalog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Назад к каталогу</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Галерея */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative aspect-[16/9]">
                <ImageWithFallback src={carImages[activeSlide]}
                  alt={`${car.brand} ${car.model} — фото ${activeSlide + 1}`}
                  className="w-full h-full object-cover" />
                {carImages.length > 1 && (
                  <>
                    <button onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors">
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <button onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors">
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {carImages.map((_, i) => (
                        <button key={i} onClick={() => setActiveSlide(i)}
                          className={`w-10 h-1 rounded-full transition-colors ${i === activeSlide ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {carImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {carImages.map((src, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${i === activeSlide ? 'border-primary' : 'border-transparent'}`}>
                      <ImageWithFallback src={src} alt={`Миниатюра ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Заголовок */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-semibold">{car.brand} {car.model}</h1>
                    {car.mileage === 0 && (
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">Новый</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{car.year} год • {formatMileage(car.mileage)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => car && toggleFavorite(car.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
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
                    <p className="font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Характеристики */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Характеристики</h2>
              <div className="space-y-3">
                {specs.map(([label, value], i) => (
                  <div key={label} className={`flex justify-between py-3 ${i < specs.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {car.description && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Описание</h2>
                <p className="text-muted-foreground leading-relaxed">{car.description}</p>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 sticky top-20">
              <h3 className="font-semibold mb-4">Свяжитесь с нами</h3>
              <div className="space-y-3 mb-6">
                <button onClick={() => { window.location.href = 'tel:+79001234567'; }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity">
                  <Phone className="w-5 h-5" />
                  <span>Позвонить</span>
                </button>
                <button onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                  <Calendar className="w-5 h-5" />
                  <span>Записаться на просмотр</span>
                </button>
              </div>

              {showAppointmentForm && (
                <form className="space-y-3 pt-4 border-t border-border" onSubmit={handleAppointmentSubmit}>
                  <input type="text" placeholder="Ваше имя" required value={formName} onChange={e => setFormName(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <input type="tel" placeholder="Телефон" required value={formPhone} onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <select value={formTime} onChange={e => setFormTime(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary">
                    {['08:00','09:00','10:00','11:00','12:00','13:00','15:00','16:00','17:00','18:00','19:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <textarea placeholder="Комментарий" rows={3} value={formComment} onChange={e => setFormComment(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
                  <button type="submit" disabled={submitting}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
                    {submitting ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold mb-3">Менеджер</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg">АИ</div>
                  <div>
                    <p className="font-semibold">Алексей Иванов</p>
                    <p className="text-sm text-muted-foreground">Менеджер по продажам</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold mb-3">Гарантии</h4>
                <div className="space-y-2">
                  {['Проверка юридической чистоты', 'Техническая диагностика', 'Гарантия на автомобиль', 'Помощь в оформлении'].map(text => (
                    <div key={text} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{text}</span>
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