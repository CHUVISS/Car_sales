import { Link, useNavigate } from 'react-router';
import { Search, Car, Shield, Wallet, Headset } from 'lucide-react';
import { CarCard } from '../components/CarCard';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { useCars } from '../hooks/useCars';
import { messagesApi } from '../api/messages';

// import Mercedes from '../../assets/mercedes.jpg';
// import Ford from '../../assets/ford.jpg';

const ALL_BRANDS = ['Audi', 'BMW', 'Hyundai', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Skoda', 'Tesla', 'Toyota', 'Volkswagen'];

const inputCls = "w-full px-4 py-3 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-primary";

export function HomePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const navigate = useNavigate();
  const [searchBrand, setSearchBrand] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { cars, loading } = useCars({ limit: 6, sort_by: 'date_desc' });

  const adaptedCars = cars.map(car => ({
    id: car.id, brand: car.brand, model: car.model, year: car.year,
    price: Number(car.price), mileage: car.mileage,
    transmission: (car.transmission === 'automatic' || car.transmission === 'robot' || car.transmission === 'variator') ? 'automatic' as const : 'manual' as const,
    fuel: (car.fuel_type ?? 'petrol') as 'petrol' | 'diesel' | 'electric' | 'hybrid',
    color: car.color ?? '', engineVolume: Number(car.engine_volume ?? 0),
    drive: 'front' as const,
    body: (car.body_type ?? 'sedan') as 'sedan' | 'suv' | 'hatchback' | 'wagon' | 'coupe' | 'minivan',
    power: car.engine_power ?? 0,
    images: car.images.length > 0 ? car.images.map(img => img.url) : ['placeholder'],
    description: car.description ?? '',
    isNew: car.status === 'available' && car.mileage === 0,
    createdAt: car.created_at, vin: car.vin ?? undefined,
  }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchBrand ? `/catalog?brand=${searchBrand}` : '/catalog');
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail) { toast.error('Укажите email для связи'); return; }
    if (!localStorage.getItem('access_token')) {
      toast.error('Для отправки заявки необходимо войти в аккаунт', {
        action: { label: 'Войти', onClick: () => navigate('/auth') },
      });
      return;
    }
    setSubmitting(true);
    try {
      await messagesApi.send({
        name: formName, email: formEmail,
        phone: formPhone || undefined,
        body: formComment || 'Заявка с главной страницы',
        message_type: 'callback',
      });
      toast.success('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
      setFormName(''); setFormPhone(''); setFormComment(''); setFormEmail('');
    } catch {
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Герой */}
      <section className="relative bg-primary text-primary-foreground group">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80"
            alt="Автомобили"
            className="w-full h-full object-cover opacity-20 transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-semibold mb-4 transition-transform duration-300 group-hover:scale-105">
              Найдите автомобиль своей мечты
            </h1>
            <p className="text-lg opacity-90 mb-8 transition-transform duration-300 group-hover:scale-105 origin-left">
              Широкий выбор новых и подержанных автомобилей. Выгодные условия, гарантия качества.
            </p>
            <form onSubmit={handleSearch} className="bg-card rounded-lg p-4 shadow-lg border border-border transition-all duration-300 group-hover:shadow-[0_0_24px_6px_hsl(var(--primary)/0.25)]">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={searchBrand}
                    onChange={e => setSearchBrand(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg outline-none focus:ring-2 focus:ring-primary border border-border transition-all duration-200 focus:scale-[1.02]"
                  >
                    <option value="">Все марки</option>
                    {ALL_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </div>
                <button type="submit"
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                  <Search className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  <span>Найти</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Категории
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/catalog" className="group relative overflow-hidden rounded-lg bg-secondary hover:shadow-lg transition-shadow border border-border">
            <div className="absolute inset-0">
              <ImageWithFallback src={Mercedes}
                alt="Новые автомобили"
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="relative p-8">
              <Car className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">Новые автомобили</h3>
              <p className="text-muted-foreground">Последние модели с заводской гарантией</p>
            </div>
          </Link>
          <Link to="/catalog" className="group relative overflow-hidden rounded-lg bg-secondary hover:shadow-lg transition-shadow border border-border">
            <div className="absolute inset-0">
              <ImageWithFallback src={Ford}
                alt="С пробегом"
                className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="relative p-8">
              <Car className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">С пробегом</h3>
              <p className="text-muted-foreground">Проверенные автомобили по выгодной цене</p>
            </div>
          </Link>
        </div>
      </section> */}

      {/* Популярные модели */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 group">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-foreground transition-transform duration-300 group-hover:scale-105">
            Популярные модели
          </h2>
          <Link to="/catalog" className="text-primary hover:underline transition-transform duration-300 group-hover:scale-105">
            Смотреть все →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="aspect-[4/3] bg-secondary animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-secondary rounded animate-pulse" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-2/3" />
                  <div className="h-7 bg-secondary rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adaptedCars.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        )}
      </section>

      {/* Преимущества */}
      <section className="bg-secondary border-y border-border py-16 group">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center text-foreground mb-12 transition-transform duration-300 group-hover:scale-105">
            Наши преимущества
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Гарантия качества', desc: 'Все автомобили проходят тщательную проверку перед продажей' },
              { icon: Wallet, title: 'Выгодные условия', desc: 'Гибкие программы кредитования и trade-in' },
              { icon: Headset, title: 'Поддержка 24/7', desc: 'Наши специалисты всегда готовы помочь вам' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center group/adv cursor-default">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4
                  transition-all duration-300
                  group-hover/adv:scale-110 group-hover/adv:bg-primary/20
                  group-hover/adv:shadow-[0_0_18px_4px_hsl(var(--primary)/0.35)]
                  group-hover/adv:ring-2 group-hover/adv:ring-primary/30">
                  <Icon className="w-8 h-8 text-primary transition-transform duration-300 group-hover/adv:scale-110" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 transition-transform duration-300 group-hover/adv:scale-105">
                  {title}
                </h3>
                <p className="text-muted-foreground transition-transform duration-300 group-hover/adv:scale-105">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}