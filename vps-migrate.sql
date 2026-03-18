-- Создание таблицы blocks (блоки CMS лендинга)
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  data TEXT NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Создание таблицы portfolio (портфолио)
CREATE TABLE IF NOT EXISTS portfolio (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Наполнение blocks дефолтными данными (только если таблица пустая)
INSERT INTO blocks (id, type, "order", data, is_active)
SELECT * FROM (VALUES
  (1, 'hero', 0, '{"title":"Крупносерийное производство изделий из дерева","subtitle":"Разделочные доски, подносы, кухонные принадлежности и декор из массива. Работаем с B2B-клиентами по всей России.","cta":"Оставить заявку"}', true),
  (2, 'clients', 1, '{"title":"Нам доверяют"}', true),
  (3, 'features', 2, '{"title":"Почему выбирают нас","items":[{"icon":"factory","title":"Собственное производство","description":"1500 м² в Московской области"},{"icon":"truck","title":"Быстрая доставка","description":"По всей России"},{"icon":"shield","title":"Гарантия качества","description":"Контроль на каждом этапе"}]}', true),
  (4, 'products', 3, '{"title":"Каталог продукции","description":"Широкий ассортимент деревянных изделий для вашего бизнеса"}', true),
  (5, 'portfolio', 4, '{"title":"Портфолио","description":"Примеры наших работ"}', true),
  (6, 'process', 5, '{"title":"Как мы работаем","steps":[{"title":"Заявка","description":"Оставьте заявку или позвоните нам"},{"title":"Расчёт","description":"Рассчитаем стоимость и сроки"},{"title":"Производство","description":"Изготовим в срок с контролем качества"},{"title":"Доставка","description":"Доставим в любую точку России"}]}', true),
  (7, 'contacts', 6, '{"title":"Свяжитесь с нами","phone":"+7 (495) 000-00-00","email":"info@woodiny.ru","address":"Московская область"}', true)
) AS v(id, type, "order", data, is_active)
WHERE NOT EXISTS (SELECT 1 FROM blocks LIMIT 1);

-- Сброс счётчика sequence чтобы следующий id был правильным
SELECT setval('blocks_id_seq', (SELECT MAX(id) FROM blocks));
