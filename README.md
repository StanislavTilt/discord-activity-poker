# MOON Poker — Discord Bot

Discord-бот для игры в Texas Hold'em покер с веб-интерфейсом на Vue.js и поддержкой Discord Activity.

---

## Превью

После запуска откройте `/preview` для живого просмотра стола с ползунком количества игроков (2-15).

### Что вы увидите:
- Покерный стол с MOON логотипом и полумесяцем
- Игроки расположены по эллипсу вокруг стола
- Общие карты (флоп), банк, фаза игры
- Свои карты крупнее остальных
- Таблица комбинаций справа
- Панель настроек (фон, стол, карты, звук) слева
- Полный мобильный адаптив (портрет + ландшафт)

---

## Возможности

- **Discord Activity** — игра запускается прямо внутри Discord
- **Discord интеграция** — создание игр через `/poker create`, присоединение через кнопки
- **Веб-покер** — полноценный стол с анимациями, картами, фишками
- **Админ-панель** — настройка блайндов, стека, времени на ход, смена блайндов во время игры
- **До 12 игроков** за одним столом
- **Texas Hold'em** — полная логика: пре-флоп, флоп, тёрн, ривер, вскрытие
- **Кастомизация** — 6 фонов, 8 столов, 6 рубашек, 5 стилей карт
- **Звуки** — раздача карт, фишки, чек, фолд, олл-ин, победа (Web Audio API)
- **Мобильный адаптив** — портрет и ландшафт для iPhone/Android
- **Результаты в Discord** — таблица мест, время игры, раздачи
- **Полный лог** — каждая раздача, каждое действие сохраняется в БД
- **Конфетти победителя** — анимация на весь экран при победе
- **Смена блайндов** — огненное оповещение всем игрокам в реальном времени

## Технологии

| Компонент | Технология |
|-----------|-----------|
| Discord бот | discord.js v14 |
| Discord Activity | @discord/embedded-app-sdk |
| Сервер | Express.js + WebSocket (ws) |
| База данных | SQLite (better-sqlite3) |
| Фронтенд | Vue 3 + Vite + Vue Router |
| Авторизация | JWT + Discord OAuth2 |
| Туннель | Cloudflare Tunnel / ngrok |

---

## Быстрый старт

### 1. Клонирование

```bash
git clone https://github.com/StanislavTilt/discord-activity-poker.git
cd discord-activity-poker
```

### 2. Установка зависимостей

```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Создание Discord бота

1. Откройте [Discord Developer Portal](https://discord.com/developers/applications)
2. Нажмите **"New Application"** → введите имя
3. Перейдите в **Bot** → нажмите **"Add Bot"**
4. Включите **SERVER MEMBERS INTENT** и **MESSAGE CONTENT INTENT**
5. Скопируйте **Token** бота

### 4. Включение Discord Activity

1. В Developer Portal → ваше приложение → **Activities**
2. Нажмите **"Enable Activities"**
3. В **URL Mappings** добавьте:
   - Prefix: `/` → Target: `ваш-url.trycloudflare.com` (без https://)
4. В **OAuth2** → скопируйте **CLIENT SECRET**

### 5. Настройка .env

Создайте файл `.env` в корне проекта:

```env
# Discord Bot
BOT_TOKEN=ваш_токен_бота
CLIENT_ID=id_приложения
CLIENT_SECRET=ваш_client_secret
GUILD_ID=id_сервера_discord

# Роли и пользователи с правом создания игр (через запятую)
ALLOWED_ROLE_IDS=123456789,987654321
ALLOWED_USER_IDS=111111111,222222222

# Server
PORT=3001
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=любая_случайная_строка
```

**Как получить ID:**
- **GUILD_ID**: ПКМ по серверу Discord → "Копировать ID сервера" (нужен режим разработчика)
- **CLIENT_ID**: Developer Portal → General Information → Application ID
- **ROLE_IDS**: ПКМ по роли в настройках сервера → "Копировать ID роли"

### 6. Регистрация slash-команд

```bash
node bot/deploy-commands.js
```

### 7. Сборка фронтенда

```bash
cd frontend && npm run build && cd ..
```

### 8. Запуск

#### Локальная разработка (два терминала)

```bash
# Терминал 1: бэкенд + бот
node start.js

# Терминал 2: фронтенд (hot reload)
cd frontend && npm run dev
```

#### Production с публичным доступом (Cloudflare)

```bash
node start-tunnel.js
```

Скрипт автоматически:
1. Создаёт Cloudflare Tunnel
2. Запускает сервер
3. Запускает Discord бота
4. Выводит публичный URL

**Важно:** после запуска обновите URL в Developer Portal → Activities → URL Mappings!

#### С ngrok

```bash
# Терминал 1
ngrok http 3001

# Терминал 2
node start-public.js https://xxxx.ngrok-free.app
```

### 9. Приглашение бота на сервер

Используйте ссылку (замените CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=ВАШ_CLIENT_ID&permissions=2147483648&scope=bot%20applications.commands
```

---

## Как играть

### Шаг 1: Создание игры
В Discord введите `/poker create`. Бот отправит ссылку на админ-панель.

### Шаг 2: Настройка
В админ-панели задайте блайнды, стек, время на ход, макс. игроков. Нажмите **"Зарегистрировать игру"**.

### Шаг 3: Присоединение
В канале появится сообщение с кнопками:
- **"Участвовать"** — регистрирует в игре
- **"Открыть покер"** — запускает Discord Activity

### Шаг 4: Запуск
Когда все присоединились → нажмите **"Запустить игру"** в админ-панели.

### Шаг 5: Игра
Каждый игрок видит только свои карты. Действия:

| Кнопка | Действие |
|--------|----------|
| **Сброс** | Сбросить карты |
| **Чек** | Пропустить ход (если нет ставки) |
| **Колл** | Уравнять ставку |
| **Рейз** | Повысить ставку |
| **Ва-банк** | Поставить все фишки |

### Шаг 6: Результаты
По окончании игры:
- Экран победителя с конфетти
- Результаты публикуются в Discord
- Полный лог доступен в админ-панели

---

## Кастомизация (в игре)

Нажмите **⚙** в левом верхнем углу:

| Раздел | Варианты |
|--------|----------|
| **Звук** | Вкл/выкл + регулятор громкости |
| **Фон** | Частицы, Туманность, Северное сияние, Огонь, Матрица, Океан |
| **Стол** | Классика, Королевский, Кармин, Аметист, Чёрный, Золото, Океан, Изумруд |
| **Стиль карт** | Классика, Тёмная, Неон, Винтаж, Люкс |
| **Рубашка** | Классика, Королевская, Неон, Кармин, Изумруд, Серебро |

---

## Админ-панель

### Во время игры
- Просмотр списка игроков
- **Смена блайндов** — в реальном времени с огненным оповещением у всех игроков
- Быстрые пресеты: 10/20, 25/50, 50/100, 100/200, 200/400, 500/1000

### После завершения
- Статистика: время игры, кол-во раздач, стек, блайнды
- Таблица результатов с местами
- Полный лог каждой раздачи: карты игроков, общие карты, все действия, фишки после руки

---

## Структура проекта

```
poker/
├── bot/                          # Discord бот
│   ├── index.js                  # Команды, кнопки, Activity, результаты
│   ├── commands/poker.js         # Slash-команда /poker create
│   └── deploy-commands.js        # Регистрация команд
├── server/                       # Express + WebSocket
│   ├── index.js                  # HTTP + WS сервер
│   ├── db.js                     # SQLite БД
│   ├── game/
│   │   ├── engine.js             # Движок Texas Hold'em
│   │   ├── deck.js               # Колода карт
│   │   └── evaluator.js          # Оценка комбинаций
│   └── routes/
│       ├── admin.js              # API админ-панели
│       ├── game.js               # API игры + Activity join
│       └── oauth.js              # Discord OAuth2
├── frontend/                     # Vue 3
│   ├── src/
│   │   ├── views/
│   │   │   ├── Activity.vue      # Discord Activity
│   │   │   ├── AdminPanel.vue    # Админ-панель
│   │   │   ├── PokerRoom.vue     # Покерная комната (браузер)
│   │   │   └── Preview.vue       # Превью стола
│   │   ├── components/
│   │   │   ├── PokerTable.vue    # Стол + MOON лого
│   │   │   ├── PlayerSeat.vue    # Место игрока (эллипс)
│   │   │   ├── Card.vue          # 5 стилей + 6 рубашек
│   │   │   ├── ActionBar.vue     # Кнопки действий
│   │   │   ├── ComboTable.vue    # Таблица комбинаций
│   │   │   ├── SettingsPanel.vue # Настройки
│   │   │   └── AnimatedBackground.vue # 6 фонов
│   │   ├── composables/
│   │   │   ├── useWebSocket.js   # WebSocket
│   │   │   ├── useSounds.js      # Web Audio API
│   │   │   └── useDiscordSDK.js  # Discord Activity SDK
│   │   └── router.js
│   └── vite.config.js
├── .env                          # Конфигурация
├── start.js                      # Запуск (localhost)
├── start-tunnel.js               # Запуск + Cloudflare Tunnel
└── start-public.js               # Запуск с любым URL
```

---

## Покерные комбинации

| # | Комбинация | Описание |
|---|-----------|----------|
| 1 | Рояль-флеш | A-K-Q-J-10 одной масти |
| 2 | Стрит-флеш | 5 карт подряд одной масти |
| 3 | Каре | 4 одинаковых карты |
| 4 | Фулл-хаус | Тройка + пара |
| 5 | Флеш | 5 карт одной масти |
| 6 | Стрит | 5 карт подряд |
| 7 | Тройка | 3 одинаковых карты |
| 8 | Две пары | 2 пары |
| 9 | Пара | 2 одинаковых карты |
| 10 | Старшая карта | Ничего из вышеперечисленного |

---

## API

### REST

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/game/:id` | Информация об игре |
| PUT | `/api/admin/game/:id/settings` | Изменить настройки |
| POST | `/api/admin/game/:id/register` | Зарегистрировать игру |
| POST | `/api/admin/game/:id/start` | Запустить игру |
| POST | `/api/admin/game/:id/blinds` | Сменить блайнды |
| GET | `/api/admin/game/:id/results` | Результаты + лог |
| POST | `/api/oauth/token` | Discord OAuth2 обмен |
| POST | `/api/game/activity-join` | Подключение через Activity |

### WebSocket

Подключение: `wss://host/ws?token=JWT`

```json
// Клиент → Сервер
{ "type": "action", "action": "fold|check|call|raise|allin", "amount": 100 }

// Сервер → Клиент
{ "type": "gameState", "data": { ... } }
{ "type": "handEnd", "data": { "winners": [...], "pot": 500 } }
{ "type": "gameOver", "data": { "winner": {...}, "standings": [...] } }
{ "type": "blindsChanged", "data": { "newSmallBlind": 50, "newBigBlind": 100 } }
```

---

## Звуки (Web Audio API — без файлов)

| Звук | Когда |
|------|-------|
| Card Deal | Раздача (пре-флоп) |
| Card Flip | Флоп, тёрн, ривер |
| Chips | Колл, банк |
| Chip Stack | Рейз, выигрыш |
| Check | Чек |
| Fold | Сброс |
| All-In | Ва-банк |
| Win | Победа |
| Your Turn | Ваш ход |
| Blinds Change | Смена блайндов |

---

## Лицензия

MIT
