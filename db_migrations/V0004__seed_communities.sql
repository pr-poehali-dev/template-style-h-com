INSERT INTO communities (name, description)
SELECT * FROM (VALUES
  ('Дизайнеры России', 'Обсуждаем UI/UX, делимся кейсами'),
  ('Разработка на React', 'Всё о React, TypeScript, фронтенде'),
  ('Фотографы', 'Фото, техника, локации, вдохновение'),
  ('Маркетинг 2026', 'Тренды, кейсы, стратегии продвижения')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM communities LIMIT 1);