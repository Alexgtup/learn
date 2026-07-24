---
term: REST
aliases: 
---
# 📘 Полный гайд по REST API для собеседований

Исчерпывающий справочник по REST API. Мы построим **реальный проект** (REST API для интернет-магазина) от начала до конца — от проектирования URL до production-ready реализации. Материал разбит на **три уровня сложности** (Junior → Middle → Senior), с примерами на Node.js/Express и клиентскими запросами.

---

## 📋 Содержание

- [Введение: что такое REST?](#введение-что-такое-rest)
- [Краткая теория по уровням](#краткая-теория-по-уровням)
- [🎯 Проект: E-Commerce REST API](#-проект-e-commerce-rest-api)
- [Шаг 1: Проектирование ресурсов и URL](#шаг-1-проектирование-ресурсов-и-url)
- [Шаг 2: HTTP-методы и операции CRUD](#шаг-2-http-методы-и-операции-crud)
- [Шаг 3: Статус-коды и правильные ответы](#шаг-3-статус-коды-и-правильные-ответы)
- [Шаг 4: Пагинация, фильтрация, сортировка](#шаг-4-пагинация-фильтрация-сортировка)
- [Шаг 5: Аутентификация и авторизация](#шаг-5-аутентификация-и-авторизация)
- [Шаг 6: Валидация, ошибки и best practices](#шаг-6-валидация-ошибки-и-best-practices)
- [Шаг 7: Кэширование, CORS, Rate Limiting](#шаг-7-кэширование-cors-rate-limiting)
- [Шаг 8: Версионирование и документация](#шаг-8-версионирование-и-документация)
- [REST vs GraphQL vs gRPC — когда что выбрать](#rest-vs-graphql-vs-grpc--когда-что-выбрать)
- [Типовые вопросы на собеседовании](#типовые-вопросы-на-собеседовании)
- [Частые подводные камни](#частые-подводные-камни)
- [Чек-лист](#чек-лист)

---

## Введение: что такое REST?

**REST (Representational State Transfer)** — архитектурный стиль для построения распределённых систем, описанный Роем Филдингом в его диссертации 2000 года. Это **не протокол и не стандарт**, а набор принципов, которым должно удовлетворять API, чтобы считаться RESTful.

**Главная идея:** всё в системе — это **ресурсы** (документы, пользователи, заказы), у каждого ресурса есть **URI** (уникальный идентификатор), а взаимодействие происходит через **стандартные HTTP-методы** без сохранения состояния между запросами.

**6 архитектурных ограничений REST:**

1. **Client-Server** — разделение клиента и сервера
2. **Stateless** — каждый запрос содержит всю необходимую информацию, сервер не хранит состояние клиента
3. **Cacheable** — ответы явно помечены как кэшируемые или нет
4. **Uniform Interface** — единообразный интерфейс (идентификация ресурсов, манипуляция через представления, self-descriptive сообщения, HATEOAS)
5. **Layered System** — клиент не знает, общается ли он с сервером напрямую или через прокси
6. **Code on Demand** (опционально) — сервер может передавать клиенту исполняемый код (например, JavaScript)

**API считается RESTful только если соответствует ВСЕМ 6 ограничениям.** На практике почти все «REST API» — это на самом деле **HTTP API с REST-подобными принципами**. Истинно RESTful API с HATEOAS встречаются редко.

---

## Краткая теория по уровням

### Junior
- REST — стиль архитектуры для веб-API
- Основные методы: GET, POST, PUT, DELETE
- Ресурсы идентифицируются URL (`/users/123`)
- Правильные статус-коды (200, 201, 404, 500)
- JSON как основной формат данных

### Middle
- Разница между PUT и PATCH
- Идемпотентность и безопасность методов
- Пагинация (offset vs cursor-based)
- Аутентификация (JWT, OAuth 2.0)
- CORS и его настройка
- Версионирование API

### Senior
- HATEOAS и его роль
- Условные запросы (ETag, If-None-Match)
- Content negotiation
- Rate limiting стратегии
- Проектирование сложных ресурсных отношений
- REST vs GraphQL vs gRPC — архитектурные trade-offs
- Истинная RESTful-архитектура по Ричардсону (4 уровня зрелости)

---

## 🎯 Проект: E-Commerce REST API

Мы построим **REST API для интернет-магазина** со следующими возможностями:
- Управление товарами (Products)
- Категории (Categories)
- Пользователи (Users) и аутентификация
- Корзина (Cart)
- Заказы (Orders)
- Отзывы (Reviews)
- Админка с правами доступа

**Стек:**
- Node.js + Express + TypeScript
- PostgreSQL (но в примерах — in-memory для простоты)
- JWT для аутентификации
- Zod для валидации

**Структура проекта:**

```
ecommerce-api/
├── src/
│   ├── routes/
│   │   ├── products.ts
│   │   ├── users.ts
│   │   ├── orders.ts
│   │   └── auth.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── validate.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── server.ts
├── tests/
├── docs/
│   └── openapi.yaml
└── package.json
```

---

## Шаг 1: Проектирование ресурсов и URL

### Идентифицируем ресурсы

Из предметной области выделяем **существительные** — это наши ресурсы:

- `Product` — товар
- `Category` — категория
- `User` — пользователь
- `Order` — заказ
- `Review` — отзыв
- `Cart` — корзина (один на пользователя)

### Правила именования URL

| Правило | ✅ Правильно | ❌ Неправильно |
|---|---|---|
| Существительные во мн. числе | `/products` | `/product`, `/getProducts` |
| kebab-case | `/user-profiles` | `/userProfiles`, `/user_profiles` |
| Иерархия через вложенность | `/users/123/orders` | `/getUserOrders?userId=123` |
| Без глаголов | `POST /orders` | `/createOrder`, `/orders/create` |
| Максимум 2 уровня вложенности | `/products/123/reviews` | `/categories/5/products/123/reviews/1` |

### Проектируем URL-карту

```
# Аутентификация
POST   /api/v1/auth/register        # регистрация
POST   /api/v1/auth/login           # вход
POST   /api/v1/auth/refresh         # обновление токена
POST   /api/v1/auth/logout          # выход

# Пользователи
GET    /api/v1/users/me             # текущий пользователь
PATCH  /api/v1/users/me             # обновить профиль
GET    /api/v1/users/:id            # публичный профиль

# Товары
GET    /api/v1/products             # список (с пагинацией/фильтрами)
GET    /api/v1/products/:id         # один товар
POST   /api/v1/products             # создать (admin)
PUT    /api/v1/products/:id         # заменить (admin)
PATCH  /api/v1/products/:id         # обновить частично (admin)
DELETE /api/v1/products/:id         # удалить (admin)

# Категории
GET    /api/v1/categories
GET    /api/v1/categories/:id
GET    /api/v1/categories/:id/products   # товары в категории

# Корзина
GET    /api/v1/cart                 # получить корзину
POST   /api/v1/cart/items           # добавить товар
PATCH  /api/v1/cart/items/:itemId   # изменить количество
DELETE /api/v1/cart/items/:itemId   # удалить из корзины
DELETE /api/v1/cart                 # очистить корзину

# Заказы
GET    /api/v1/orders               # мои заказы
POST   /api/v1/orders               # оформить заказ
GET    /api/v1/orders/:id           # детали заказа
PATCH  /api/v1/orders/:id/status    # изменить статус (admin)

# Отзывы
GET    /api/v1/products/:id/reviews
POST   /api/v1/products/:id/reviews
DELETE /api/v1/reviews/:id          # автор или admin
```

### Иерархия vs «плоские» ресурсы

```
# ✅ Когда использовать вложенность: отношение «владеет»
GET /users/123/orders       # заказы конкретного пользователя
GET /products/456/reviews   # отзывы о товаре

# ✅ Когда использовать плоские URL: самостоятельные ресурсы с фильтром
GET /orders?userId=123      # если можем фильтровать по многим критериям
GET /reviews?productId=456
```

**Правило:** если ресурс может существовать отдельно — делайте его «плоским» с фильтрами. Если всегда принадлежит родителю — используйте вложенность.

---

## Шаг 2: HTTP-методы и операции CRUD

### Таблица соответствия

| Операция | HTTP-метод | URL | Идемпотентный | Безопасный |
|---|---|---|---|---|
| Получить список | `GET` | `/products` | ✅ | ✅ |
| Получить один | `GET` | `/products/:id` | ✅ | ✅ |
| Создать | `POST` | `/products` | ❌ | ❌ |
| Заменить полностью | `PUT` | `/products/:id` | ✅ | ❌ |
| Обновить частично | `PATCH` | `/products/:id` | ❌ | ❌ |
| Удалить | `DELETE` | `/products/:id` | ✅ | ❌ |

**Безопасный метод (safe)** — не изменяет состояние сервера (только `GET`, `HEAD`, `OPTIONS`).

**Идемпотентный метод** — повторный вызов даёт тот же результат, что и первый. Например, `DELETE /products/123` при повторном вызове вернёт 404, но состояние сервера не изменится — товар всё так же удалён.

### Реализация на Express + TypeScript

```typescript
// src/routes/products.ts
import { Router, Request, Response, NextFunction } from "express";
import { ProductService } from "../services/productService";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createProductSchema, updateProductSchema } from "../schemas/product";

const router = Router();
const productService = new ProductService();

// GET /api/v1/products — список товаров
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = "1",
      limit = "20",
      category,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      q,
    } = req.query;

    const result = await productService.findAll({
      page: Number(page),
      limit: Math.min(Number(limit), 100),  // защита от огромных limit
      category: category as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as string,
      order: order as "asc" | "desc",
      search: q as string | undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id — один товар
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: `Product ${req.params.id} not found`,
      });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/products — создать товар (только admin)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.create(req.body);
      res.status(201).location(`/api/v1/products/${product.id}`).json(product);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/products/:id — полная замена (только admin)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(createProductSchema),  // PUT требует ВСЕ поля
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.replace(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "NOT_FOUND" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/products/:id — частичное обновление
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateProductSchema),  // PATCH — только передаваемые поля
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.update(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "NOT_FOUND" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/products/:id
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await productService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "NOT_FOUND" });
      }
      res.status(204).send();  // No Content
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### PUT vs PATCH — ключевая разница

```typescript
// PUT — ПОЛНАЯ замена ресурса. Нужно передать ВСЕ поля.
PUT /products/123
{
  "name": "iPhone 15",
  "price": 999,
  "description": "Новый iPhone",   // обязательно!
  "categoryId": 5,                 // обязательно!
  "stock": 100                     // обязательно!
}

// PATCH — ЧАСТИЧНОЕ обновление. Только изменяемые поля.
PATCH /products/123
{
  "price": 899   // изменилась только цена
}
```

**Когда что использовать:**
- `PUT` — когда у вас есть полная форма редактирования
- `PATCH` — когда меняете одно-два поля (чаще в реальных API)

---

## Шаг 3: Статус-коды и правильные ответы

### Основные статус-коды

#### 2xx — Успех

| Код | Название | Когда использовать |
|---|---|---|
| `200` | OK | Успешные GET, PUT, PATCH, DELETE |
| `201` | Created | Успешный POST (создан ресурс) |
| `202` | Accepted | Запрос принят, но обработка асинхронна |
| `204` | No Content | Успех без тела ответа (часто для DELETE) |

#### 3xx — Перенаправления

| Код | Название | Использование |
|---|---|---|
| `301` | Moved Permanently | Ресурс навсегда перемещён |
| `302` | Found | Временное перенаправление |
| `304` | Not Modified | Кэш актуален (для условных запросов) |

#### 4xx — Ошибки клиента

| Код | Название | Когда |
|---|---|---|
| `400` | Bad Request | Некорректный запрос (валидация) |
| `401` | Unauthorized | Нет аутентификации |
| `403` | Forbidden | Аутентифицирован, но нет прав |
| `404` | Not Found | Ресурс не найден |
| `405` | Method Not Allowed | Метод не поддерживается |
| `409` | Conflict | Конфликт (например, дубликат email) |
| `410` | Gone | Ресурс был, но удалён навсегда |
| `422` | Unprocessable Entity | Валидация не пройдена (семантическая) |
| `429` | Too Many Requests | Превышен rate limit |

#### 5xx — Ошибки сервера

| Код | Название | Когда |
|---|---|---|
| `500` | Internal Server Error | Непредвиденная ошибка сервера |
| `502` | Bad Gateway | Вышестоящий сервер вернул ошибку |
| `503` | Service Unavailable | Сервер временно недоступен |
| `504` | Gateway Timeout | Таймаут от вышестоящего сервера |

### Правильные форматы ответов

#### Успешный GET списка с пагинацией

```json
{
  "data": [
    { "id": "1", "name": "iPhone", "price": 999 },
    { "id": "2", "name": "iPad", "price": 799 }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "links": {
    "self": "/api/v1/products?page=1&limit=20",
    "next": "/api/v1/products?page=2&limit=20",
    "last": "/api/v1/products?page=8&limit=20"
  }
}
```

#### Успешный POST (создание)

```http
HTTP/1.1 201 Created
Location: /api/v1/products/abc123
Content-Type: application/json

{
  "id": "abc123",
  "name": "iPhone 15",
  "price": 999,
  "createdAt": "2026-07-16T12:00:00Z"
}
```

#### Ошибка с деталями

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "not-an-email"
      },
      {
        "field": "password",
        "message": "Must be at least 8 characters"
      }
    ],
    "requestId": "req_abc123xyz",
    "timestamp": "2026-07-16T12:00:00Z"
  }
}
```

### Middleware для централизованной обработки ошибок

```typescript
// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Логируем ошибку
  console.error(`[${req.method}] ${req.url}`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.requestId,
      },
    });
  }

  // Неизвестная ошибка — не раскрываем детали клиенту
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId: req.requestId,
    },
  });
}

// Использование:
// throw new AppError(404, "NOT_FOUND", `Product ${id} not found`);
// throw new AppError(400, "VALIDATION_ERROR", "Invalid input", details);
```

---

## Шаг 4: Пагинация, фильтрация, сортировка

### Пагинация: offset-based vs cursor-based

#### Offset-based (классическая)

```http
GET /api/v1/products?page=3&limit=20
```

**Плюсы:**
- ✅ Простая реализация
- ✅ Можно перейти к произвольной странице
- ✅ Можно узнать общее количество

**Минусы:**
- ❌ Медленно на больших offset (`OFFSET 1000000` в SQL — сканирует все предыдущие строки)
- ❌ При изменении данных возможны дубликаты/пропуски

```typescript
// Реализация
async findAll(params: FindParams) {
  const { page, limit, ...filters } = params;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    db.products.findMany({
      where: buildWhere(filters),
      skip: offset,
      take: limit,
      orderBy: { [params.sort]: params.order },
    }),
    db.products.count({ where: buildWhere(filters) }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
```

#### Cursor-based (ключевая)

```http
GET /api/v1/products?cursor=eyJpZCI6MTIzfQ&limit=20
```

Курсор — это закодированный (обычно base64) идентификатор последнего элемента предыдущей страницы.

**Плюсы:**
- ✅ Быстро даже на огромных таблицах
- ✅ Стабильно при изменениях данных

**Минусы:**
- ❌ Нельзя перейти к произвольной странице
- ❌ Нельзя узнать общее количество без отдельного запроса

```typescript
// Реализация
async findAllCursor(cursor?: string, limit: number = 20) {
  const where = cursor
    ? { id: { gt: decodeCursor(cursor) } }
    : {};

  const data = await db.products.findMany({
    where,
    take: limit + 1,  // берём на 1 больше, чтобы понять, есть ли следующая
    orderBy: { id: "asc" },
  });

  const hasNext = data.length > limit;
  if (hasNext) data.pop();

  const nextCursor = hasNext && data.length > 0
    ? encodeCursor(data[data.length - 1].id)
    : null;

  return {
    data,
    pagination: {
      nextCursor,
      hasNext,
      limit,
    },
  };
}
```

**Когда что использовать:**
- **Offset** — админки, дашборды, когда нужно знать общее количество
- **Cursor** — бесконечные ленты, мобильные приложения, большие объёмы данных

### Фильтрация через query-параметры

```http
GET /api/v1/products?category=electronics&minPrice=100&maxPrice=1000&inStock=true
GET /api/v1/products?tags=smartphone,5g          # массив через запятую
GET /api/v1/products?tags[]=smartphone&tags[]=5g # массив через []
GET /api/v1/products?createdAt[gte]=2026-01-01   # операторы сравнения
```

```typescript
// Гибкая фильтрация
interface FilterOperators {
  eq?: any;
  ne?: any;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  in?: any[];
  like?: string;
}

function buildWhere(query: Record<string, any>) {
  const where: any = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "object" && value !== null) {
      // Операторы: price[gte]=100
      where[key] = {};
      for (const [op, val] of Object.entries(value)) {
        where[key][`$${op}`] = val;
      }
    } else {
      where[key] = value;
    }
  }

  return where;
}
```

### Сортировка

```http
GET /api/v1/products?sort=price           # по возрастанию
GET /api/v1/products?sort=-price          # по убыванию (минус)
GET /api/v1/products?sort=price,-createdAt  # несколько полей
```

```typescript
function parseSort(sort: string): Record<string, "asc" | "desc"> {
  return sort.split(",").reduce((acc, field) => {
    if (field.startsWith("-")) {
      acc[field.slice(1)] = "desc";
    } else {
      acc[field] = "asc";
    }
    return acc;
  }, {} as Record<string, "asc" | "desc">);
}
```

---

## Шаг 5: Аутентификация и авторизация

### Регистрация и вход

```typescript
// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/v1/auth/register
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await db.users.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "CONFLICT", "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.users.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "user",
      },
    });

    const tokens = generateTokens(user);
    res.status(201).json({
      user: sanitizeUser(user),
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await db.users.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // Важно: одна и та же ошибка для обоих случаев (безопасность)
      throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
    }

    const tokens = generateTokens(user);
    res.json({
      user: sanitizeUser(user),
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "30d" }
  );

  return { accessToken, refreshToken };
}
```

### Middleware аутентификации

```typescript
// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Authorization header",
      },
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: "TOKEN_INVALID",
        message: "Access token is invalid or expired",
      },
    });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED" } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
    }
    next();
  };
}
```

### Refresh tokens

```typescript
// POST /api/v1/auth/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, "BAD_REQUEST", "Refresh token required");
    }

    // Проверяем в БД — не отозван ли
    const stored = await db.refreshTokens.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.revokedAt) {
      throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid");
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await db.users.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError(401, "TOKEN_INVALID");
    }

    // Отзываем старый refresh token (rotation)
    await db.refreshTokens.update({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    // Выдаём новую пару
    const tokens = generateTokens(user);
    await db.refreshTokens.create({
      data: { token: tokens.refreshToken, userId: user.id },
    });

    res.json(tokens);
  } catch (error) {
    next(error);
  }
});
```

### Клиентский код

```typescript
// src/api/client.ts
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(private baseURL: string) {}

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    let response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers,
    });

    // Если access токен истёк — пробуем refresh
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refresh();
      if (refreshed) {
        headers.set("Authorization", `Bearer ${this.accessToken}`);
        response = await fetch(`${this.baseURL}${path}`, { ...options, headers });
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error);
    }

    if (response.status === 204) return undefined as any;
    return response.json();
  }

  private async refresh(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const tokens = await res.json();
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## Шаг 6: Валидация, ошибки и best practices

### Валидация через Zod

```typescript
// src/schemas/product.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive().max(1_000_000),
  categoryId: z.string().uuid(),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).max(10).optional(),
  attributes: z.record(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();  // все поля опциональны

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
```

```typescript
// src/middlewares/validate.ts
import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
        },
      });
    }

    req[source] = result.data;  // заменяем на очищенные данные
    next();
  };
}
```

### Best practices проектирования

#### 1. Используйте множественное число для коллекций

```
✅ GET /products          # список товаров
✅ GET /products/123      # конкретный товар
❌ GET /product           # непонятно
❌ GET /getProduct/123    # глагол в URL
```

#### 2. Не используйте глаголы — используйте HTTP-методы

```
✅ POST   /orders         # создать заказ
✅ DELETE /orders/123     # удалить заказ
❌ POST   /createOrder
❌ POST   /deleteOrder/123
```

#### 3. Используйте существительные для действий над ресурсом

Если действие нельзя выразить через CRUD — создайте **подобный ресурсу** endpoint:

```
✅ POST /orders/123/cancel     # отмена = создание ресурса "отмена"
✅ POST /users/123/activate    # активация
❌ POST /orders/123/cancelOrder
```

#### 4. Возвращайте правильные Location-заголовки

```typescript
// При создании — Location с URI нового ресурса
res.status(201)
   .location(`/api/v1/products/${product.id}`)
   .json(product);

// При асинхронной обработке — 202 + Location для проверки статуса
res.status(202)
   .location(`/api/v1/jobs/${jobId}`)
   .json({ jobId, status: "processing" });
```

#### 5. Используйте snake_case или camelCase последовательно

```json
// ✅ Выберите один стиль и придерживайтесь
{
  "user_id": "123",
  "created_at": "2026-07-16T12:00:00Z"
}

// ИЛИ
{
  "userId": "123",
  "createdAt": "2026-07-16T12:00:00Z"
}
```

#### 6. Даты всегда в ISO 8601 с часовым поясом

```json
{
  "createdAt": "2026-07-16T12:00:00.000Z"
}
```

#### 7. Никогда не раскрывайте внутренние детали

```json
// ❌ Плохо
{
  "error": "Query failed: SELECT * FROM users WHERE id='abc'; OR 1=1"
}

// ✅ Хорошо
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_abc123"
  }
}
```

---

## Шаг 7: Кэширование, CORS, Rate Limiting

### Условные запросы и кэширование

```typescript
// src/middlewares/cache.ts
import crypto from "crypto";

export function cacheControl(maxAge: number, isPublic: boolean = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set(
      "Cache-Control",
      `${isPublic ? "public" : "private"}, max-age=${maxAge}`
    );
    next();
  };
}

export function etag(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = (body: any) => {
    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(body))
      .digest("hex");
    const etag = `"${hash}"`;
    
    res.set("ETag", etag);
    
    // Условный запрос: клиент прислал If-None-Match
    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }
    
    return originalJson(body);
  };
  
  next();
}

// Использование:
router.get(
  "/products/:id",
  cacheControl(60),     // кэш на 1 минуту
  etag,
  async (req, res) => {
    const product = await productService.findById(req.params.id);
    res.json(product);
  }
);
```

**Как это работает:**
1. Первый запрос: сервер возвращает `ETag: "abc123"`
2. Клиент кэширует и запоминает ETag
3. Повторный запрос: клиент шлёт `If-None-Match: "abc123"`
4. Если ETag совпадает → `304 Not Modified` (без тела, экономия трафика)

### CORS (Cross-Origin Resource Sharing)

```typescript
// src/middlewares/cors.ts
import cors from "cors";

const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://myshop.com", "https://admin.myshop.com"]
  : ["http://localhost:3000", "http://localhost:5173"];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,           // разрешаем куки
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Total-Count", "Location"],
  maxAge: 86400,               // кэш preflight на 24 часа
});
```

**Важно:** CORS — это **защита браузера**, а не сервера. Серверные клиенты (curl, Postman, Node.js) игнорируют CORS.

### Rate Limiting

```typescript
// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Общий лимит
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 минут
  max: 100,                    // 100 запросов
  standardHeaders: true,       // RateLimit-* заголовки
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
      retryAfter: 900,
    },
  },
});

// Строгий лимит для auth
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                      // 5 попыток входа
  skipSuccessfulRequests: true,  // не считать успешные
  message: {
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many login attempts",
    },
  },
});

// Использование:
app.use("/api/", generalLimiter);
app.use("/api/v1/auth/login", authLimiter);
```

**Заголовки rate limiting:**

```http
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1721138400
Retry-After: 900
```

---

## Шаг 8: Версионирование и документация

### Стратегии версионирования

#### 1. В URL (самый популярный)

```
/api/v1/products
/api/v2/products
```

**Плюсы:** просто, очевидно, легко маршрутизировать.
**Минусы:** засоряет URL.

#### 2. В заголовке Accept

```http
GET /products
Accept: application/vnd.myshop.v1+json
```

**Плюсы:** URL остаётся чистым.
**Минусы:** менее очевидно, сложнее тестировать.

#### 3. В query-параметре

```
GET /products?version=1
```

**Не рекомендуется** — смешивает версию с бизнес-параметрами.

### Реализация версионирования

```typescript
// src/server.ts
import express from "express";
import v1Routes from "./routes/v1";
import v2Routes from "./routes/v2";

const app = express();

// Монтируем разные версии на разные префиксы
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);

// Общая middleware (auth, logging) применяется ко всем
app.use(logRequests);
app.use(authenticate);
```

### Документация через OpenAPI (Swagger)

```yaml
# docs/openapi.yaml
openapi: 3.1.0
info:
  title: E-Commerce API
  version: 1.0.0
  description: REST API для интернет-магазина
servers:
  - url: https://api.myshop.com/v1
    description: Production
  - url: http://localhost:3000/v1
    description: Development

paths:
  /products:
    get:
      summary: Получить список товаров
      tags: [Products]
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
        - name: category
          in: query
          schema: { type: string }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductList'
        '400':
          $ref: '#/components/responses/BadRequest'

    post:
      summary: Создать товар
      tags: [Products]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProduct'
      responses:
        '201':
          description: Created
          headers:
            Location:
              schema: { type: string }
              description: URI созданного ресурса

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Product:
      type: object
      required: [id, name, price, categoryId]
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        price: { type: number, minimum: 0 }
        categoryId: { type: string, format: uuid }
        createdAt: { type: string, format: date-time }
```

**Инструменты:**
- **Swagger UI** — интерактивная документация
- **Redoc** — красивые статические страницы
- **Stoplight** — полноценная IDE для API

---

## REST vs GraphQL vs gRPC — когда что выбрать

### Сравнительная таблица

| Критерий | REST | GraphQL | gRPC |
|---|---|---|---|
| Протокол | HTTP/1.1 | HTTP/1.1, HTTP/2 | HTTP/2 |
| Формат | JSON, XML | JSON | Protobuf (binary) |
| Endpoint | Много (`/users`, `/orders`) | Один (`/graphql`) | Много (сервисы) |
| Over-fetching | ❌ Есть | ✅ Нет | ❌ Есть |
| Under-fetching | ❌ Есть | ✅ Нет | ❌ Есть |
| Кэширование | ✅ Встроенное (HTTP) | ❌ Сложное | ❌ Сложное |
| Версионирование | В URL | Через схему | В proto-файлах |
| Инструменты | Зрелые | Зрелые | Зрелые |
| Learning curve | Низкая | Средняя | Высокая |
| Streaming | ❌ (SSE/WebSocket) | ✅ Subscriptions | ✅ Bidirectional |
| Браузер | ✅ Отлично | ✅ Хорошо | ❌ Только через прокси |
| Мобильные | ✅ Хорошо | ✅ Отлично | ⚠️ Средне |

### Когда REST

- ✅ Простые CRUD-операции
- ✅ Публичные API
- ✅ Нужно HTTP-кэширование
- ✅ Много разных клиентов (браузер, мобайл, партнёры)
- ✅ Команда знакома с REST

### Когда GraphQL

- ✅ Сложные связанные данные (соцсети, e-commerce)
- ✅ Мобильные приложения (экономия трафика)
- ✅ Много разных клиентов с разными потребностями
- ✅ Быстро меняющиеся требования к фронту
- ✅ Нужны подписки на события

### Когда gRPC

- ✅ Микросервисы (server-to-server)
- ✅ Высокая производительность критична
- ✅ Streaming (видео, аудио, realtime)
- ✅ Строгие контракты между сервисами
- ✅ Внутренняя сеть (не для браузера напрямую)

### Гибридный подход (часто лучший)

```
[Мобильное приложение] ──GraphQL──▶ [API Gateway]
                                         │
[Веб-сайт] ────────────REST──────────────┤
                                         │
[Партнёры] ────────────REST──────────────┤
                                         │
                                         ▼
                                   [Микросервисы]
                                     │      │
                                     └─gRPC─┘
```

---

## Типовые вопросы на собеседовании

### Q1: Что такое REST и какие у него принципы?
**Ответ:** REST (Representational State Transfer) — архитектурный стиль, описанный Роем Филдингом. 6 принципов: client-server, stateless, cacheable, uniform interface, layered system, code on demand (опционально). Ресурсы идентифицируются URI, взаимодействие через стандартные HTTP-методы.

### Q2: Чем REST отличается от HTTP?
**Ответ:** HTTP — это **протокол** передачи данных. REST — **архитектурный стиль**, который использует HTTP (но не обязан). REST можно реализовать и поверх других протоколов, но на практике почти всегда используется HTTP.

### Q3: В чём разница между PUT и PATCH?
**Ответ:** 
- **PUT** — полная замена ресурса. Клиент передаёт ВСЕ поля, даже неизменённые. Идемпотентный.
- **PATCH** — частичное обновление. Только изменяемые поля. Не идемпотентный (в общем случае).

### Q4: Что такое идемпотентность?
**Ответ:** Свойство операции, при котором повторные вызовы дают тот же результат, что и первый. `GET`, `PUT`, `DELETE` — идемпотентны. `POST`, `PATCH` — нет. Пример: `DELETE /products/123` при повторном вызове вернёт 404, но состояние сервера не изменится.

### Q5: Что такое безопасность (safety) метода?
**Ответ:** Безопасный метод не изменяет состояние сервера. Только `GET`, `HEAD`, `OPTIONS`. Все безопасные методы идемпотентны, но не наоборот.

### Q6: Когда возвращать 401, а когда 403?
**Ответ:**
- **401 Unauthorized** — клиент не аутентифицирован (нет токена, токен истёк)
- **403 Forbidden** — клиент аутентифицирован, но у него нет прав на операцию

Путаница возникает из-за названия: «Unauthorized» на самом деле означает «Unauthenticated».

### Q7: Как правильно пагинровать большие наборы данных?
**Ответ:** Два подхода:
- **Offset-based** (`?page=3&limit=20`) — просто, но медленно на больших offset
- **Cursor-based** (`?cursor=abc123&limit=20`) — быстро и стабильно, но нельзя прыгать по страницам

Cursor лучше для лент и мобильных приложений, offset — для админок.

### Q8: Зачем нужен HATEOAS?
**Ответ:** HATEOAS (Hypermedia As The Engine Of Application State) — принцип, при котором сервер возвращает ссылки на возможные действия. Клиент не должен «знать» API заранее — он следует ссылкам. Пример:

```json
{
  "id": 123,
  "status": "pending",
  "_links": {
    "self": "/orders/123",
    "cancel": { "href": "/orders/123/cancel", "method": "POST" },
    "payment": { "href": "/orders/123/payment", "method": "POST" }
  }
}
```

### Q9: Как работает CORS и зачем он нужен?
**Ответ:** CORS — механизм браузера, ограничивающий cross-origin запросы. Если фронт на `frontend.com` делает запрос на `api.backend.com` — браузер сначала отправляет **preflight** (`OPTIONS`) запрос, чтобы узнать, разрешает ли сервер такие запросы. Сервер отвечает заголовками `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` и т.д. На серверные клиенты (curl, Node.js) CORS не влияет.

### Q10: Как правильно версионировать API?
**Ответ:** Основные стратегии:
1. **В URL** (`/v1/products`) — самое популярное, простое
2. **В заголовке Accept** (`Accept: application/vnd.myapi.v1+json`) — чище URL
3. **В query** (`?v=1`) — не рекомендуется

Лучше использовать URL-версионирование и поддерживать 2-3 версии одновременно.

### Q11: Что такое ETag и условные запросы?
**Ответ:** ETag — «отпечаток» ресурса (обычно хэш). Клиент сохраняет его и при повторном запросе шлёт в `If-None-Match`. Если ETag совпадает — сервер отвечает `304 Not Modified` без тела, экономя трафик. Похоже работает `Last-Modified` с `If-Modified-Since`.

### Q12: Как защитить API от злоупотреблений?
**Ответ:**
- **Rate limiting** — ограничение запросов в единицу времени
- **Аутентификация** — JWT, OAuth 2.0
- **Валидация входных данных** — защита от инъекций
- **HTTPS обязательно** — защита от MITM
- **CORS** — ограничение источников
- **Логирование и мониторинг** — быстрое выявление аномалий

### Q13: В чём разница между 422 и 400?
**Ответ:**
- **400 Bad Request** — синтаксическая ошибка (невалидный JSON, неизвестные параметры)
- **422 Unprocessable Entity** — синтаксис корректный, но семантическая ошибка (например, `age: -5`)

На практике часто используется 400 для обоих случаев.

### Q14: Что такое Richardson Maturity Model?
**Ответ:** 4 уровня «зрелости» REST API:
- **Level 0** — один endpoint, один метод (RPC-стиль, `/api?action=getUser&id=123`)
- **Level 1** — ресурсы, но один метод (многие endpoints, но всё через POST)
- **Level 2** — ресурсы + правильные HTTP-методы и статусы (большинство «REST» API)
- **Level 3** — Level 2 + HATEOAS (настоящий REST)

### Q15: REST vs GraphQL — когда что выбрать?
**Ответ:**
- **REST** — простые CRUD, публичные API, нужно HTTP-кэширование
- **GraphQL** — сложные связанные данные, мобильные приложения, разные клиенты с разными потребностями
- Часто лучшее решение — **гибрид**: REST для простых ресурсов, GraphQL для сложных запросов

---

## Частые подводные камни

### 1. Глаголы в URL

```
❌ GET /getUser/123
❌ POST /createOrder
❌ POST /products/delete/123

✅ GET /users/123
✅ POST /orders
✅ DELETE /products/123
```

### 2. Возврат 200 для ошибок

```json
// ❌ Плохо: HTTP 200, но внутри ошибка
HTTP/1.1 200 OK
{ "success": false, "error": "Not found" }

// ✅ Хорошо: правильный статус-код
HTTP/1.1 404 Not Found
{ "error": { "code": "NOT_FOUND", "message": "User not found" } }
```

### 3. Непоследовательные имена

```
❌ /users, /product, /orderItems, /order_items, /OrderItems
✅ /users, /products, /order-items (или /orderItems — но ЕДИНООБРАЗНО)
```

### 4. Отсутствие версионирования

Запускать API без версии — закладывать мину замедленного действия. Любое breaking change сломает существующих клиентов.

### 5. Возврат паролей и чувствительных данных

```typescript
// ❌
res.json(user);  // { id, email, password, ... }

// ✅
function sanitizeUser(user: User) {
  const { password, refreshToken, ...safe } = user;
  return safe;
}
res.json(sanitizeUser(user));
```

### 6. Неиспользование HTTPS

Все production API должны работать только по HTTPS. Без HTTPS — уязвимость к MITM-атакам, краже токенов, сниффингу трафика.

### 7. Хранение состояния на сервере

```typescript
// ❌ Нарушение принципа Stateless
const sessions = new Map();  // в памяти
app.post("/login", (req, res) => {
  sessions.set(req.body.userId, { loggedIn: true });
});

// ✅ Stateless — всё в токене
app.post("/login", (req, res) => {
  const token = jwt.sign({ userId }, secret);
  res.json({ token });
});
```

### 8. Игнорирование Content-Type

```typescript
// ❌ Не проверяем Content-Type, не валидируем
app.post("/users", (req, res) => {
  db.users.create(req.body);  // что угодно может прийти
});

// ✅ Валидация + строгий Content-Type
app.post("/users", 
  express.json({ type: "application/json" }),
  validate(createUserSchema),
  handler
);
```

### 9. Смешивание бизнес-логики в контроллерах

```typescript
// ❌ Плохо
router.post("/orders", async (req, res) => {
  // 100 строк бизнес-логики прямо здесь
});

// ✅ Хорошо — separation of concerns
router.post("/orders", validate(createOrderSchema), orderController.create);

// orderController.ts
export const create = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};
```

### 10. Отсутствие request ID для трейсинга

```typescript
// ✅ Каждая запрос получает уникальный ID
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.set("X-Request-ID", req.requestId);
  next();
});
```

Это критически важно для отладки в production — по request ID можно найти логи во всех микросервисах.

---

## Чек-лист

### Проектирование API

- [ ] Ресурсы именованы существительными во множественном числе
- [ ] URL в kebab-case (или camelCase — но последовательно)
- [ ] Не более 2 уровней вложенности
- [ ] Нет глаголов в URL (кроме специальных действий)
- [ ] Выбран и задокументирован формат дат (ISO 8601)
- [ ] Определена стратегия версионирования

### Реализация

- [ ] Используются правильные HTTP-методы
- [ ] Возвращаются правильные статус-коды
- [ ] POST возвращает 201 + Location
- [ ] DELETE возвращает 204 No Content
- [ ] PUT требует все поля, PATCH — только изменяемые
- [ ] Есть валидация входных данных
- [ ] Централизованная обработка ошибок
- [ ] Не раскрываются внутренние детали в ошибках

### Безопасность

- [ ] Только HTTPS
- [ ] Настроен CORS
- [ ] Аутентификация через JWT или OAuth 2.0
- [ ] Разделение 401 и 403
- [ ] Rate limiting на всех endpoints
- [ ] Особо строгий лимит на auth endpoints
- [ ] Валидация и санитизация входных данных
- [ ] Хэширование паролей (bcrypt, argon2)
- [ ] Чувствительные данные не возвращаются в ответах

### Производительность

- [ ] Настроены заголовки кэширования
- [ ] ETag для условных запросов
- [ ] Пагинация на всех списках
- [ ] Максимальный limit ограничен (например, 100)
- [ ] N+1 queries устранены
- [ ] Индексы в БД для фильтров и сортировки

### Документация

- [ ] OpenAPI/Swagger спецификация
- [ ] Примеры запросов и ответов
- [ ] Описание ошибок
- [ ] Гайды по аутентификации
- [ ] Changelog версий
- [ ] Postman-коллекция или аналог

### Junior
- [ ] Понимаю CRUD и HTTP-методы
- [ ] Знаю основные статус-коды (200, 201, 400, 401, 403, 404, 500)
- [ ] Умею проектировать простые URL
- [ ] Понимаю JSON как формат обмена
- [ ] Знаю про query и path параметры

### Middle
- [ ] Понимаю разницу PUT vs PATCH
- [ ] Знаю идемпотентность и безопасность
- [ ] Умею делать пагинацию (offset и cursor)
- [ ] Понимаю JWT и refresh tokens
- [ ] Умею настраивать CORS
- [ ] Знаю rate limiting
- [ ] Понимаю версионирование API

### Senior
- [ ] Знаю все 6 принципов REST
- [ ] Понимаю HATEOAS и его применение
- [ ] Умею работать с условными запросами (ETag, Last-Modified)
- [ ] Понимаю content negotiation
- [ ] Знаю Richardson Maturity Model
- [ ] Могу обосновать выбор REST vs GraphQL vs gRPC
- [ ] Умею проектировать сложные ресурсные отношения
- [ ] Понимаю trade-offs разных стратегий пагинации
- [ ] Знаю лучшие практики безопасности (OWASP API Top 10)
- [ ] Умею документировать API через OpenAPI

---

## 🎯 Финальные советы

1. **Проектируйте API как продукт.** У него есть пользователи (разработчики), и их опыт важен.
2. **Следуйте конвенциям.** Разработчики ожидают, что `GET /users/123` вернёт пользователя. Не ломайте ожидания.
3. **Документируйте сначала.** Спецификация OpenAPI должна быть написана ДО кода.
4. **Думайте о клиентах.** API живёт дольше, чем бэкенд-код. Breaking changes — дорогое удовольствие.
5. **Будьте последовательны.** Выбрал camelCase — используй везде. Выбрал 422 для валидации — везде.
6. **Безопасность по умолчанию.** HTTPS, rate limiting, валидация, санитизация — не опции, а обязательные требования.
7. **Мониторинг и логи.** Request ID, структурированные логи, метрики — без них вы слепы в production.

---

> **Автор заметки:** этот гайд покрывает ~95% вопросов по REST API на собеседованиях. Для углубления изучите также: OAuth 2.0 flows (authorization code, PKCE, client credentials), WebSocket/SSE для realtime, OpenAPI 3.1, contract testing (Pact), и OWASP API Security Top 10.

Удачи на собеседовании! 🚀
