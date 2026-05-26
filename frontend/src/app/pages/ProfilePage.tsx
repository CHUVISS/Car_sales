import { useState, useEffect } from 'react';
import { User, Eye, FileText, LogOut, Heart, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { api } from '../api/client';
import { viewingsApi, type ViewingPublic } from '../api/viewings';
import { carsApi } from '../api/cars';
import { FavoritesPage } from './FavoritesPage';
import { useFavorites } from '../hooks/useFavorites';

type TabType = 'profile' | 'viewings' | 'favorites';

const inputCls = "w-full px-4 py-3 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg outline-none focus:ring-2 focus:ring-primary border border-border focus:border-primary transition-colors";

export function ProfilePage() {
  const { user, login, register, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'profile';
  const setActiveTab = (tab: TabType) => setSearchParams({ tab }, { replace: true });
  const { ids: favoriteIds } = useFavorites();

  // Форма входа/регистрации
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Форма профиля
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (isRegister && password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      setAuthLoading(false);
      return;
    }
    try {
      if (isRegister) {
        await register(email, password, fullName);
        toast.success('Регистрация прошла успешно!');
      } else {
        await login(email, password);
        toast.success('Добро пожаловать!');
      }
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast.error(message === 'Incorrect email or password' ? 'Неверный email или пароль' : message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
    navigate('/');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/user/profile', {
        full_name: editName || undefined,
        phone: editPhone || undefined,
      });
      toast.success('Изменения сохранены!');
      window.location.reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Страница входа / регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Логотип */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold">АвтоСалон</span>
            </Link>
          </div>

          {/* Карточка */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Переключатель вход / регистрация */}
            <div className="flex border-b border-border">
              <button
                onClick={() => { setIsRegister(false); setPassword(''); setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  !isRegister
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Войти
              </button>
              <button
                onClick={() => { setIsRegister(true); setPassword(''); setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  isRegister
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Регистрация
              </button>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground mb-1">
                  {isRegister ? 'Создать аккаунт' : 'Добро пожаловать'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isRegister
                    ? 'Заполните данные для регистрации'
                    : 'Введите данные для входа в аккаунт'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Имя
                    </label>
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className={inputCls}
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="example@mail.ru"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputCls}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Пароль
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => toast.info('Функция восстановления пароля в разработке')}
                      >
                        Забыли пароль?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isRegister ? 'Минимум 8 символов' : '••••••••'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={inputCls + ' pr-12'}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                  </div>
                  {isRegister && password.length > 0 && (
                    <PasswordStrength password={password} />
                  )}
                </div>

                {isRegister && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Подтверждение пароля
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Повторите пароль"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className={inputCls + ' pr-12' + (confirmPassword.length > 0 && confirmPassword !== password ? ' border-destructive focus:ring-destructive' : '')}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }
                      </button>
                    </div>
                    {confirmPassword.length > 0 && confirmPassword !== password && (
                      <p className="mt-1 text-xs text-destructive">Пароли не совпадают</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium mt-2"
                >
                  {authLoading
                    ? <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                        {isRegister ? 'Регистрация...' : 'Вход...'}
                      </span>
                    : isRegister ? 'Зарегистрироваться' : 'Войти'
                  }
                </button>
              </form>

              {/* Разделитель */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-card text-muted-foreground">
                    {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setIsRegister(!isRegister); setPassword(''); setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); }}
                className="w-full px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors border border-border text-sm font-medium"
              >
                {isRegister ? 'Войти в существующий аккаунт' : 'Создать новый аккаунт'}
              </button>
            </div>
          </div>

          {/* Ссылка обратно */}
          <p className="text-center mt-6 text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">← Вернуться на главную</Link>
          </p>
        </div>
      </div>
    );
  }

  // Личный кабинет

  const tabs: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'viewings', label: 'Мои записи', icon: FileText },
    { id: 'favorites', label: 'Избранное', icon: Heart, badge: favoriteIds.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold text-foreground mb-8">Личный кабинет</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Боковое меню */}
          <aside className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-4 space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="pt-1 border-t border-border mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Выйти</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Контент */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                    {user.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{user.full_name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">Роль: {user.role}</p>
                  </div>
                </div>
                <form className="space-y-4" onSubmit={handleSaveProfile}>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Имя</label>
                    <input type="text" placeholder={user.full_name} value={editName}
                      onChange={e => setEditName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Телефон</label>
                    <input type="tel" placeholder={user.phone ?? '+7 (___) ___-__-__'} value={editPhone}
                      onChange={e => setEditPhone(e.target.value)} className={inputCls} />
                  </div>
                  <button type="submit" disabled={saving}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </form>
              </div>
            )}
            {activeTab === 'viewings' && <ViewingsList />}
            {activeTab === 'favorites' && <FavoritesPage />}
          </div>
        </div>
      </div>
    </div>
  );
}

// PasswordStrength

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Минимум 8 символов', ok: password.length >= 8 },
    { label: 'Заглавная буква', ok: /[A-ZА-ЯЁ]/.test(password) },
    { label: 'Цифра', ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-destructive', 'bg-yellow-500', 'bg-accent', 'bg-accent'];
  const labels = ['', 'Слабый', 'Средний', 'Сильный'];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-border'}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs ${score === 3 ? 'text-accent' : score === 2 ? 'text-yellow-500' : 'text-destructive'}`}>
          {labels[score]}
        </p>
      )}
    </div>
  );
}

// ViewingsList

const RESULT_LABELS: Record<string, string> = {
  scheduled: 'Запланирован', confirmed: 'Подтверждён', completed: 'Завершён',
  cancelled_user: 'Отменён', cancelled_manager: 'Отменён менеджером', no_show: 'Не явился',
};
const RESULT_COLORS: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary',
  confirmed: 'bg-accent/10 text-accent',
  completed: 'bg-muted text-muted-foreground',
  cancelled_user: 'bg-destructive/10 text-destructive',
  cancelled_manager: 'bg-destructive/10 text-destructive',
  no_show: 'bg-secondary text-muted-foreground',
};

function ViewingsList() {
  const [viewings, setViewings] = useState<ViewingPublic[]>([]);
  const [carsMap, setCarsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await viewingsApi.list();
      setViewings(data.data);

      // Загружаем названия машин параллельно
      const uniqueIds = [...new Set(data.data.map(v => v.car_id))];
      const results = await Promise.allSettled(uniqueIds.map(id => carsApi.get(id)));
      const map: Record<string, string> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const c = r.value;
          map[uniqueIds[i]] = `${c.brand} ${c.model} ${c.year}`;
        }
      });
      setCarsMap(map);
    } catch {
      // нет записей или не авторизован
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: string) => {
    try {
      await viewingsApi.cancel(id);
      toast.success('Запись отменена');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (viewings.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Нет записей на просмотр</h3>
        <p className="text-muted-foreground mb-4">Перейдите в каталог и запишитесь на просмотр понравившегося авто</p>
        <Link to="/catalog" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Мои записи на просмотр</h2>
      {viewings.map(v => (
        <div key={v.id} className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link
                to={`/car/${v.car_id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {carsMap[v.car_id] ?? 'Автомобиль'}
              </Link>
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(v.viewing_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                {v.viewing_time ? ` в ${v.viewing_time}` : ''}
              </p>
              {v.comment && (
                <p className="text-sm text-muted-foreground mt-1 italic">«{v.comment}»</p>
              )}
            </div>
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${RESULT_COLORS[v.result] ?? 'bg-secondary text-muted-foreground'}`}>
              {RESULT_LABELS[v.result] ?? v.result}
            </span>
          </div>
          {(v.result === 'scheduled' || v.result === 'confirmed') && (
            <button
              onClick={() => handleCancel(v.id)}
              className="mt-4 px-4 py-2 text-sm text-destructive border border-destructive/50 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              Отменить запись
            </button>
          )}
        </div>
      ))}
    </div>
  );
}