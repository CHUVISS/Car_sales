import { Link } from 'react-router';
import { Car, Phone, User, Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">АвтоСалон</span>
          </Link>

          {/* Навигация (десктоп) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/catalog" className="text-foreground hover:text-primary transition-colors">
              Каталог
            </Link>
            <Link to="/catalog?isNew=true" className="text-foreground hover:text-primary transition-colors">
              Новые авто
            </Link>
            <Link to="/catalog?isNew=false" className="text-foreground hover:text-primary transition-colors">
              С пробегом
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              О нас
            </Link>
          </nav>

          {/* Контакты и кабинет */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+79001234567" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Phone className="w-5 h-5" />
              <span>+7 (900) 123-45-67</span>
            </a>
            <Link 
              to="/profile" 
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <User className="w-5 h-5" />
              <span>Войти</span>
            </Link>
          </div>

          {/* Мобильное меню */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Мобильное меню (раскрывающееся) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link to="/catalog" className="text-foreground hover:text-primary transition-colors">
                Каталог
              </Link>
              <Link to="/catalog?isNew=true" className="text-foreground hover:text-primary transition-colors">
                Новые авто
              </Link>
              <Link to="/catalog?isNew=false" className="text-foreground hover:text-primary transition-colors">
                С пробегом
              </Link>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors">
                О нас
              </Link>
              <a href="tel:+79001234567" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <Phone className="w-5 h-5" />
                <span>+7 (900) 123-45-67</span>
              </a>
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity w-fit"
              >
                <User className="w-5 h-5" />
                <span>Войти</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
