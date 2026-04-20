import { Link, useNavigate } from 'react-router';
import { Search, Car, Shield, Wallet, Headset } from 'lucide-react';
import { CarCard } from '../components/CarCard';
import { getCars, getAllBrands } from '../data/mockData';
import { useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';

export function HomePage() {
  const navigate = useNavigate();
  const [searchBrand, setSearchBrand] = useState('');
  const popularCars = getCars().slice(0, 6);
  const brands = getAllBrands();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchBrand) {
      navigate(`/catalog?brand=${searchBrand}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Герой-баннер */}
      <section className="relative bg-primary text-primary-foreground">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80"
            alt="Автомобили"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-semibold mb-4">
              Найдите автомобиль своей мечты
            </h1>
            <p className="text-lg opacity-90 mb-8">
              Широкий выбор новых и подержанных автомобилей. Выгодные условия, гарантия качества.
            </p>

            {/* Форма поиска */}
            <form onSubmit={handleSearch} className="bg-white rounded-lg p-4 shadow-lg">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <select
                    value={searchBrand}
                    onChange={(e) => setSearchBrand(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Все марки</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Найти</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Категории */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/catalog?isNew=true"
            className="group relative overflow-hidden rounded-lg bg-secondary hover:shadow-lg transition-shadow"
          >
            <div className="absolute inset-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1603386329225-868f9b1ee6b1?w=800&q=80"
                alt="Новые автомобили"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative p-8">
              <Car className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-2xl font-semibold mb-2">Новые автомобили</h3>
              <p className="text-muted-foreground">Последние модели с заводской гарантией</p>
            </div>
          </Link>

          <Link
            to="/catalog?isNew=false"
            className="group relative overflow-hidden rounded-lg bg-secondary hover:shadow-lg transition-shadow"
          >
            <div className="absolute inset-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"
                alt="С пробегом"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative p-8">
              <Car className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-2xl font-semibold mb-2">С пробегом</h3>
              <p className="text-muted-foreground">Проверенные автомобили по выгодной цене</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Популярные модели */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold">Популярные модели</h2>
          <Link to="/catalog" className="text-primary hover:underline">
            Смотреть все →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularCars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* Преимущества */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center mb-12">Наши преимущества</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Гарантия качества</h3>
              <p className="text-muted-foreground">
                Все автомобили проходят тщательную проверку перед продажей
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Выгодные условия</h3>
              <p className="text-muted-foreground">
                Гибкие программы кредитования и trade-in
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Headset className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Поддержка 24/7</h3>
              <p className="text-muted-foreground">
                Наши специалисты всегда готовы помочь вам
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Форма быстрой заявки */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Оставьте заявку</h2>
          <p className="text-muted-foreground text-center mb-6">
            Наш менеджер свяжется с вами в течение 10 минут
          </p>
          <form 
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
              (e.target as HTMLFormElement).reset();
            }}
          >
            <input
              type="text"
              placeholder="Ваше имя"
              required
              className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="tel"
              placeholder="Телефон"
              required
              className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              placeholder="Комментарий (необязательно)"
              rows={3}
              className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Отправить заявку
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}