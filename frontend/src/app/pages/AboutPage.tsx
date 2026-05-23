import { Shield, Award, Users, Clock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

import alexImage from '../../assets/Alex_1.png';
import matveyImage from '../../assets/Matt.png';
import alekseyImage from '../../assets/Alex2_1.png';
import danilaImage from '../../assets/Danila2.png';
import timofeyImage from '../../assets/Tima.png';

export function AboutPage() {
  const teamMembers = [
    { name: 'Чувилов Александр', role: 'Тимлид', image: alexImage },
    { name: 'Дворников Матвей', role: 'Backend-разработчик', image: matveyImage },
    { name: 'Иващенко Алексей', role: 'Тестировщик', image: alekseyImage },
    { name: 'Барышев Данила', role: 'Архитектор (Возможно умер)', image: danilaImage },
    { name: 'Жуков Тимофей', role: 'Frontend-разработчик', image: timofeyImage }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold mb-4">О нас</h1>
          <p className="text-lg opacity-90 max-w-3xl">
            Мы - гордые студенты РТУ МИРЭА и очень любим дисциплину "Создание програмного обеспечения"
          </p>
        </div>
      </section>

      {/* Преимущества */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1 год</h3>
            <p className="text-muted-foreground">на рынке автомобилей</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">100+</h3>
            <p className="text-muted-foreground">довольных клиентов</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">100%</h3>
            <p className="text-muted-foreground">проверенные автомобили</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Лучший</h3>
            <p className="text-muted-foreground">автосалон 2026 года</p>
          </div>
        </div>
      </section>

      {/* О компании */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold mb-6">Наша история</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  АвтоСалон был основан с целью сдачи курсовой работы по самой лучшей дисциплине "Создание программного обеспечения"
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden">
              <ImageWithFallback
                src="https://myauctionsheet.com/blog/wp-content/uploads/2020/06/Car-Auctions.jpg"
                alt="Наш автосалон"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Наша команда */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-semibold text-center mb-12">Наша команда</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="text-center">
              <div className="w-32 h-32 rounded-full bg-secondary mx-auto mb-4 overflow-hidden">
                <ImageWithFallback
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Контакты */}
      <section className="bg-secondary py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold mb-4">Свяжитесь с нами</h2>
          <p className="text-muted-foreground mb-8">
            Мы всегда рады ответить на ваши вопросы и помочь с выбором автомобиля
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+79001234567"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Позвонить нам
            </a>
            <a
              href="mailto:info@autosalon.ru"
              className="px-8 py-3 bg-white border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Написать email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}