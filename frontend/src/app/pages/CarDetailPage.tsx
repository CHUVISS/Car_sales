import { useParams, Link } from 'react-router';
import { getCarById, formatPrice, formatMileage, getTransmissionLabel, getFuelLabel, getDriveLabel, getBodyLabel } from '../data/mockData';
import { ArrowLeft, Heart, Share2, Phone, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const car = id ? getCarById(id) : undefined;
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  if (!car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Автомобиль не найден</h1>
          <Link to="/catalog" className="text-primary hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  const photoId = car.id === '1' ? '1621007947622-7c9b888c6cc1'
    : car.id === '2' ? '1617531653332-bd46c24f2068'
    : car.id === '3' ? '1618843479313-40f8afb4b4d8'
    : car.id === '4' ? '1551972104-ec7e52e0133e'
    : car.id === '5' ? '1606664515524-ed2f786a0bd6'
    : car.id === '6' ? '1611566026373-c54afa09f44a'
    : car.id === '7' ? '1619405399517-d7fce0f13302'
    : car.id === '8' ? '1560958089-b8a1929cea89'
    : car.id === '9' ? '1616422285623-13ff0162193c'
    : car.id === '10' ? '1600705722908-bab1e61c0b4d'
    : car.id === '11' ? '1549927681-0b673b8243ab'
    : '1627454820516-b26085b8aec0';

  const carImages = [
    `https://images.unsplash.com/photo-${photoId}?w=1200&q=80`,
    `https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80`,
    `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=1200&q=80`,
    `https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80`,
  ];

  const prevSlide = () => {
    setActiveSlide(prev => (prev === 0 ? carImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide(prev => (prev === carImages.length - 1 ? 0 : prev + 1));
  };

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
                <ImageWithFallback
                  src={carImages[activeSlide]}
                  alt={`${car.brand} ${car.model} — фото ${activeSlide + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {carImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`w-10 h-1 rounded-full transition-colors ${index === activeSlide ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 p-3 overflow-x-auto">
                {carImages.map((src, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${activeSlide === index ? 'border-primary' : 'border-transparent'}`}
                  >
                    <ImageWithFallback
                      src={src}
                      alt={`Миниатюра ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Заголовок */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-semibold">{car.brand} {car.model}</h1>
                    {car.isNew && (
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                        Новый
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {car.year} год • {formatMileage(car.mileage)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Share2 className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="text-4xl font-semibold text-primary mb-6">
                {formatPrice(car.price)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Год</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Пробег</p>
                  <p className="font-semibold">{formatMileage(car.mileage)}</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Двигатель</p>
                  <p className="font-semibold">{car.engineVolume}л</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Мощность</p>
                  <p className="font-semibold">{car.power} л.с.</p>
                </div>
              </div>
            </div>

            {/* Характеристики */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Характеристики</h2>
              <div className="space-y-3">
                {[
                  ['Марка', car.brand],
                  ['Модель', car.model],
                  ['Год выпуска', String(car.year)],
                  ['Пробег', formatMileage(car.mileage)],
                  ['Тип кузова', getBodyLabel(car.body)],
                  ['Цвет', car.color],
                  ['Двигатель', `${car.engineVolume} л`],
                  ['Мощность', `${car.power} л.с.`],
                  ['Тип топлива', getFuelLabel(car.fuel)],
                  ['Коробка передач', getTransmissionLabel(car.transmission)],
                  ['Привод', getDriveLabel(car.drive)],
                  ...(car.vin ? [['VIN', car.vin]] : []),
                ].map(([label, value], i, arr) => (
                  <div key={label} className={`flex justify-between py-3 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold font-mono text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Описание */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Описание</h2>
              <p className="text-muted-foreground leading-relaxed">{car.description}</p>
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 sticky top-20">
              <h3 className="font-semibold mb-4">Свяжитесь с нами</h3>

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
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Записаться на просмотр</span>
                </button>
              </div>

              {showAppointmentForm && (
                <form
                  className="space-y-3 pt-4 border-t border-border"
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success('Заявка на просмотр успешно отправлена! Мы свяжемся с вами для подтверждения.');
                    setShowAppointmentForm(false);
                    (e.target as HTMLFormElement).reset();
                  }}
                >
                  <input type="text" placeholder="Ваше имя" required className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <input type="tel" placeholder="Телефон" required className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <input type="date" required className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" />
                  <textarea placeholder="Комментарий" rows={3} className="w-full px-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
                  <button type="submit" className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
                    Отправить заявку
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold mb-3">Менеджер</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg">
                    АИ
                  </div>
                  <div>
                    <p className="font-semibold">Алексей Иванов</p>
                    <p className="text-sm text-muted-foreground">Менеджер по продажам</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Помогу подобрать автомобиль и организую тест-драйв</p>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold mb-3">Гарантии</h4>
                <div className="space-y-2">
                  {[
                    'Проверка юридической чистоты',
                    'Техническая диагностика',
                    'Гарантия на автомобиль',
                    'Помощь в оформлении',
                  ].map(text => (
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