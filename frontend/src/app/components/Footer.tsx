import { Link } from 'react-router';
import { Car, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* О компании */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-8 h-8" />
              <span className="text-xl font-semibold">АвтоСалон</span>
            </div>
            <p className="text-sm text-background/70">
              Ваш надежный партнер в мире автомобилей. Широкий выбор новых и подержанных автомобилей.
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h4 className="font-semibold mb-4">Навигация</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalog" className="text-sm text-background/70 hover:text-background transition-colors">
                Каталог
              </Link>
              <Link to="/catalog?isNew=true" className="text-sm text-background/70 hover:text-background transition-colors">
                Новые авто
              </Link>
              <Link to="/catalog?isNew=false" className="text-sm text-background/70 hover:text-background transition-colors">
                С пробегом
              </Link>
              <Link to="/about" className="text-sm text-background/70 hover:text-background transition-colors">
                О нас
              </Link>
            </nav>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+79001234567" className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Phone className="w-4 h-4" />
                <span>+7 (900) 123-45-67</span>
              </a>
              <a href="mailto:info@autosalon.ru" className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Mail className="w-4 h-4" />
                <span>info@autosalon.ru</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-background/70">
                <MapPin className="w-4 h-4" />
                <span>Москва, ул. Примерная, д. 1</span>
              </div>
            </div>
          </div>

          {/* Режим работы */}
          <div>
            <h4 className="font-semibold mb-4">Режим работы</h4>
            <div className="text-sm text-background/70 space-y-1">
              <p>Пн-Пт: 9:00 - 20:00</p>
              <p>Сб-Вс: 10:00 - 18:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm text-background/70">
          <p>© 2026 АвтоСалон. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
