import { Link, useNavigate } from 'react-router';
import { Car, Phone, User, Menu, LogOut, Bot } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
    navigate('/');
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">АвтоСалон</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/catalog" className="text-foreground hover:text-primary transition-colors">Каталог</Link>
            <Link to="/ai" className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
              <Bot className="w-4 h-4" />AI-ассистент
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">О нас</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+79001234567" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Phone className="w-5 h-5" />
              <span>+7 (900) 123-45-67</span>
            </a>

            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                  <User className="w-5 h-5" />
                  <span>{user.full_name.split(' ')[0]}</span>
                </Link>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <Link to="/admin" className="px-3 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm transition-colors">
                    {user.role === 'admin' ? 'Админ' : 'Менеджер'}
                  </Link>
                )}
                <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                <User className="w-5 h-5" />
                <span>Войти</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button className="p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">Каталог</Link>
              <Link to="/ai" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
                <Bot className="w-4 h-4" />AI-ассистент
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">О нас</Link>
              <a href="tel:+79001234567" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <Phone className="w-5 h-5" />
                <span>+7 (900) 123-45-67</span>
              </a>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg w-fit">
                    <User className="w-5 h-5" />
                    <span>{user.full_name}</span>
                  </Link>
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 bg-secondary text-foreground rounded-lg w-fit text-sm">
                      {user.role === 'admin' ? 'Админ' : 'Менеджер'}
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-2 text-destructive w-fit">
                    <LogOut className="w-5 h-5" />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg w-fit">
                  <User className="w-5 h-5" />
                  <span>Войти</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}