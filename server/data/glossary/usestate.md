---
term: useState
aliases: 
---
# 📘 Полный гайд по useState для собеседований

Исчерпывающий справочник по хуку `useState` в React. Материал разбит на **три уровня сложности** (Junior → Middle → Senior), чтобы каждый мог начать с комфортной точки и постепенно углубляться. Документ покрывает ~95% вопросов, которые встречаются на собеседованиях по React.

---

## 📋 Содержание

- [Введение: что такое useState?](#введение-что-такое-usestate)
- [Уровень 1 — Junior (Основы)](#уровень-1--junior-основы)
- [Уровень 2 — Middle (Уверенное владение)](#уровень-2--middle-уверенное-владение)
- [Уровень 3 — Senior (Продвинутые паттерны)](#уровень-3--senior-продвинутые-паттерны)
- [Типовые вопросы на собеседовании с ответами](#типовые-вопросы-на-собеседовании-с-ответами)
- [Частые подводные камни (gotchas)](#частые-подводные-камни-gotchas)
- [useState vs useReducer — когда что использовать](#usestate-vs-usereducer--когда-что-использовать)
- [Чек-лист перед собеседованием](#чек-лист-перед-собеседованием)

---

## Введение: что такое useState?

`useState` — это **первый и самый важный хук** в React. Он позволяет функциональным компонентам иметь собственное состояние, что раньше было возможно только в классовых компонентах через `this.state`.

**Сигнатура:**
```typescript
const [state, setState] = useState<T>(initialValue);
```

**Ключевые факты:**
- Возвращает массив из двух элементов: текущее значение и функцию для его обновления
- Состояние «привязано» к конкретному экземпляру компонента
- При вызове `setState` React перерисовывает компонент
- Состояние сохраняется между рендерами (React хранит его в fiber-дереве)
- `setState` **асинхронный** — состояние не меняется мгновенно

---

## Уровень 1 — Junior (Основы)

### 1.1 Базовое использование

```typescript
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

**Что происходит:**
1. `useState(0)` — создаёт состояние с начальным значением `0`
2. `count` — текущее значение (на первом рендере = `0`)
3. `setCount` — функция для обновления (её сигнатура стабильна между рендерами)
4. При клике вызывается `setCount(count + 1)` → React планирует ре-рендер

### 1.2 Типизация в TypeScript

```typescript
// TypeScript выводит тип автоматически
const [count, setCount] = useState(0);        // number

// Явное указание типа (обязательно, если начальное значение не описывает весь тип)
const [user, setUser] = useState<string | null>(null);
const [items, setItems] = useState<string[]>([]);

// Сложные типы
interface User {
  id: number;
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null);
```

**Правило:** если начальное значение не покрывает все возможные варианты (например, `null` или пустой массив с конкретным типом) — **всегда указывайте generic явно**.

### 1.3 Примитивные значения

```typescript
const [name, setName] = useState("");             // string
const [age, setAge] = useState(0);                // number
const [isActive, setIsActive] = useState(false);  // boolean
const [data, setData] = useState<string | null>(null);  // union
```

### 1.4 Объекты в состоянии

```typescript
interface FormState {
  name: string;
  email: string;
  age: number;
}

function Form() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    age: 0
  });

  // ❌ НЕПРАВИЛЬНО: мутируем существующий объект
  const updateName = (name: string) => {
    form.name = name;      // мутация!
    setForm(form);         // React не увидит изменений (та же ссылка)
  };

  // ✅ ПРАВИЛЬНО: создаём новый объект
  const updateNameCorrect = (name: string) => {
    setForm({ ...form, name });
  };

  return (
    <input
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
    />
  );
}
```

**Золотое правило:** состояние в React **нельзя мутировать**. Всегда создавайте новый объект/массив.

### 1.5 Массивы в состоянии

```typescript
function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);

  // Добавить элемент
  const addTodo = (text: string) => {
    setTodos([...todos, text]);
  };

  // Удалить элемент
  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  // Изменить элемент
  const updateTodo = (index: number, newText: string) => {
    setTodos(todos.map((todo, i) => (i === index ? newText : todo)));
  };

  // Вставить в начало
  const prependTodo = (text: string) => {
    setTodos([text, ...todos]);
  };

  // Сортировка
  const sortTodos = () => {
    setTodos([...todos].sort());
  };
}
```

**Шпаргалка операций с массивами:**

| Операция | Правильный способ |
|---|---|
| Добавить в конец | `[...arr, newItem]` |
| Добавить в начало | `[newItem, ...arr]` |
| Удалить | `arr.filter(...)` |
| Изменить | `arr.map(...)` |
| Вставить по индексу | `[...arr.slice(0, i), item, ...arr.slice(i)]` |
| Сортировка | `[...arr].sort()` |

### 1.6 Множественные useState

```typescript
function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // ...
}
```

**Когда использовать несколько useState:**
- ✅ Значения логически независимы
- ✅ Обновляются в разных местах кода
- ❌ Если значения всегда меняются вместе — лучше один объект

### 1.7 Начальное значение — литерал vs функция

```typescript
// ✅ Простой литерал — вычисляется при каждом рендере (но используется только первый раз)
const [count, setCount] = useState(0);

// ⚠️ Дорогое вычисление — будет пересчитываться при каждом рендере впустую
const [data, setData] = useState(expensiveComputation());

// ✅ Ленивая инициализация — функция вызовется ТОЛЬКО при первом рендере
const [data, setData] = useState(() => expensiveComputation());
```

**Важно:** аргумент `useState` вычисляется при каждом рендере, но используется **только в первом**. Для дорогих вычислений всегда используйте **ленивую форму** `useState(() => ...)`.

---

## Уровень 2 — Middle (Уверенное владение)

### 2.1 Асинхронность setState

Это **самый частый вопрос на Middle-собеседованиях**.

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count);  // всё ещё 0!
    // После ре-рендера count будет равен 1, а не 3!
  };
}
```

**Почему так:**
1. `setState` не меняет переменную мгновенно — он **планирует обновление**
2. В одном обработчике все вызовы видят **одно и то же** значение `count`
3. React **батчит** (объединяет) несколько setState в один ре-рендер
4. `console.log(count)` выведет значение из текущего рендера (0)

### 2.2 Функциональные обновления (Functional Updates)

Решение проблемы выше:

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(prev => prev + 1);  // ✅
    setCount(prev => prev + 1);  // ✅
    setCount(prev => prev + 1);  // ✅
    // count станет 3!
  };
}
```

**Правило:** если новое состояние **зависит от предыдущего** — используйте функциональную форму:
```typescript
setState(prevState => newState)
```

**Когда ОБЯЗАТЕЛЬНО использовать функциональные обновления:**
- ✅ Несколько `setState` подряд в одном обработчике
- ✅ `setState` внутри `setTimeout` / `setInterval`
- ✅ `setState` в `async` функциях после `await`
- ✅ `setState` в колбэках, которые могут быть stale

### 2.3 Stale Closure Problem (проблема устаревшего замыкания)

**Классический баг на собеседованиях:**

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);  // ❌ count всегда 0!
    }, 1000);
    return () => clearInterval(id);
  }, []);  // пустой массив зависимостей

  return <p>{count}</p>;  //永远 будет 1
}
```

**Почему:** `setInterval` захватил `count = 0` из первого рендера и никогда не видит обновлённое значение.

**Решение — функциональное обновление:**

```typescript
useEffect(() => {
  const id = setInterval(() => {
    setCount(prev => prev + 1);  // ✅ работает!
  }, 1000);
  return () => clearInterval(id);
}, []);
```

**Или добавить зависимость:**

```typescript
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, [count]);  // пересоздаём interval при каждом изменении count
```

### 2.4 Batching (пакетное обновление) в React 18+

До React 18 батчинг работал только в обработчиках React-событий. С React 18 — **автоматический батчинг везде**:

```typescript
// React 18: все эти setState объединятся в ОДИН ре-рендер
const handleClick = async () => {
  setCount(c => c + 1);       // ⤵
  setName("Иван");            // ⤵  один ре-рендер
  setIsLoading(false);        // ⤵

  await fetch("/api");

  setCount(c => c + 1);       // ⤵
  setName("Пётр");            // ⤵  ещё один ре-рендер (после await)
};

// setTimeout, Promise.then, нативные event listener'ы — тоже батчаться
setTimeout(() => {
  setCount(c => c + 1);  // ⤵ один ре-рендер
  setName("Иван");       // ⤵
}, 0);
```

### 2.5 `flushSync` — когда нужен синхронный setState

```typescript
import { flushSync } from "react-dom";

const handleClick = () => {
  flushSync(() => {
    setCount(c => c + 1);  // ре-рендер произойдёт немедленно
  });
  // здесь DOM уже обновлён
  document.getElementById("counter")?.scrollIntoView();

  flushSync(() => {
    setName("Иван");       // ещё один синхронный ре-рендер
  });
};
```

**Когда использовать:** очень редко. Например, когда нужно немедленно прочитать DOM после обновления.

### 2.6 Сброс состояния через `key`

```typescript
function App() {
  const [userId, setUserId] = useState(1);

  return (
    <>
      <button onClick={() => setUserId(userId + 1)}>Next User</button>
      {/* При смене key компонент пересоздаётся с нуля, 
          включая все его useState */}
      <UserProfile key={userId} userId={userId} />
    </>
  );
}
```

### 2.7 Получение «предыдущего» значения

В отличие от классовых компонентов, где был `prevState`, в хуках нужно вручную:

```typescript
function Counter() {
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);

  const increment = () => {
    setPrevCount(count);
    setCount(c => c + 1);
  };

  return <p>Текущий: {count}, предыдущий: {prevCount}</p>;
}
```

**Или через кастомный хук `usePrevious`:**

```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);
  // ...
}
```

### 2.8 useState с объектами — правильные паттерны

```typescript
interface FormState {
  name: string;
  email: string;
  password: string;
  errors: Record<string, string>;
}

function Form() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    errors: {}
  });

  // Универсальный updater для любого поля
  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <input
      value={form.name}
      onChange={(e) => updateField("name", e.target.value)}
    />
  );
}
```

### 2.9 Сброс формы целиком

```typescript
const INITIAL_FORM = { name: "", email: "", age: 0 };

function Form() {
  const [form, setForm] = useState(INITIAL_FORM);

  const reset = () => setForm(INITIAL_FORM);
  const resetWithNewValues = () => setForm({ ...INITIAL_FORM, name: "Гость" });
}
```

**Совет:** выносите начальные значения в константы вне компонента — они не будут пересоздаваться при каждом рендере.

---

## Уровень 3 — Senior (Продвинутые паттерны)

### 3.1 Внутреннее устройство useState

**Как React хранит состояние:**

1. У каждого компонента есть **fiber-узел**
2. Fiber содержит **связный список хуков** (hooks linked list)
3. Каждый `useState` создаёт объект вида:
   ```typescript
   {
     memoizedState: currentValue,   // текущее значение
     baseState: initialValue,
     queue: UpdateQueue,            // очередь обновлений
     next: nextHook                 // ссылка на следующий хук
   }
   ```
4. При вызове `setState` обновление попадает в `queue`
5. Во время следующего рендера React применяет все обновления

**Поэтому ВАЖНО:**
- Хуки **нельзя вызывать условно** (иначе собьётся порядок в списке)
- Хуки **нельзя вызывать в циклах**
- Хуки **всегда вызываются в одинаковом порядке**

### 3.2 Производное состояние (Derived State)

**Антипаттерн — хранить в состоянии то, что можно вычислить:**

```typescript
// ❌ ПЛОХО
function Cart({ items }: { items: Item[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + i.price, 0));
  }, [items]);  // лишняя синхронизация
}

// ✅ ХОРОШО
function Cart({ items }: { items: Item[] }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
  // или с useMemo, если вычисление дорогое
}
```

**Правило:** если значение можно получить из props или другого state — **не храните его в state**.

### 3.3 Синхронизация с props — когда нужен useState

```typescript
// ✅ Правильно: состояние, инициализируемое из props
function Modal({ initialIsOpen }: { initialIsOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  // ...
}

// ⚠️ Когда нужно реагировать на изменение props:
function Modal({ isOpen: propIsOpen }: { isOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(propIsOpen);

  // Синхронизация, если prop изменился
  useEffect(() => {
    setIsOpen(propIsOpen);
  }, [propIsOpen]);
}

// ✅ Современный подход без useEffect (React 16.3+):
function Modal({ isOpen: propIsOpen }: { isOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const [prevProp, setPrevProp] = useState(propIsOpen);

  if (propIsOpen !== prevProp) {
    setPrevProp(propIsOpen);
    setIsOpen(propIsOpen);
  }
}
```

### 3.4 Кастомные хуки поверх useState

```typescript
function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initial),
    set: setCount
  };
}

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

### 3.5 Ленивая инициализация — продвинутые сценарии

```typescript
// Чтение из localStorage только один раз
const [theme, setTheme] = useState<"light" | "dark">(() => {
  if (typeof window === "undefined") return "light";  // SSR
  return (localStorage.getItem("theme") as "light" | "dark") || "light";
});

// Инициализация из URL
const [query, setQuery] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("q") || "";
});

// Создание тяжёлых объектов
const [map, setMap] = useState(() => new Map<string, number>());
```

### 3.6 Оптимизация ре-рендеров с useState

```typescript
// ❌ Каждый рендер создаёт новый объект, что ломает memo
function Parent() {
  const [config, setConfig] = useState({ theme: "dark" });

  return <MemoizedChild config={config} />;  // child ре-рендерится каждый раз
}

// ✅ Вынести константы наружу
const DEFAULT_CONFIG = { theme: "dark" };
function Parent() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  // ...
}
```

**Важный момент про `setCount`:** функция-сеттер **стабильна** между рендерами (её ссылка не меняется), поэтому её можно смело передавать в `useCallback`/`useEffect` без зависимостей:

```typescript
// ✅ setCount не нужно указывать в зависимостях
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id);
}, []);  // eslint-disable-line — setCount стабилен
```

### 3.7 useState vs useRef — когда что

| Критерий | `useState` | `useRef` |
|---|---|---|
| Вызывает ре-рендер | ✅ Да | ❌ Нет |
| Сохраняется между рендерами | ✅ Да | ✅ Да |
| Мутабелен | ❌ (только через setter) | ✅ (`ref.current = ...`) |
| Значение в текущем рендере | Актуальное | Актуальное |
| Используется для | UI-данные | DOM, таймеры, prev values |

```typescript
// ✅ useRef для интервала
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const stop = () => clearInterval(intervalRef.current);
}
```

### 3.8 Опасные паттерны с useState

```typescript
// ❌ 1. Состояние в глобальной переменной
let count = 0;  // НЕ ДЕЛАЙТЕ ТАК
function Counter() {
  const [, forceUpdate] = useState(0);
  const inc = () => { count++; forceUpdate(n => n + 1); };
}

// ❌ 2. setState в теле компонента без условия (бесконечный цикл)
function Bad() {
  const [x, setX] = useState(0);
  setX(x + 1);  // 💥 бесконечный цикл ре-рендеров
  return <p>{x}</p>;
}

// ❌ 3. Хранение классов/функций в state (они не сериализуются)
const [date, setDate] = useState(new Date());
// Лучше хранить timestamp: useState(Date.now())

// ❌ 4. Использование индексов массива как key при изменении порядка
{items.map((item, i) => <Item key={i} />)}
// При удалении/вставке React перепутает компоненты
```

### 3.9 TypeScript-продвинутые сценарии

```typescript
// Discriminated union для состояний UI
type RequestState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function UserProfile({ id }: { id: number }) {
  const [state, setState] = useState<RequestState<User>>({ status: "idle" });

  useEffect(() => {
    setState({ status: "loading" });
    fetchUser(id)
      .then(data => setState({ status: "success", data }))
      .catch(error => setState({ status: "error", error }));
  }, [id]);

  switch (state.status) {
    case "idle":
    case "loading":
      return <Spinner />;
    case "success":
      return <UserView user={state.data} />;  // ✅ TS знает что data есть
    case "error":
      return <ErrorView error={state.error} />;  // ✅ TS знает что error есть
  }
}
```

### 3.10 Внутренний `queue` и порядок обновлений

```typescript
function Demo() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(1);                    // обновление 1
    setCount(prev => prev + 10);    // обновление 2 (prev = 1)
    setCount(prev => prev * 2);     // обновление 3 (prev = 11)
    // Итог: (1 + 10) * 2 = 22
  };
}
```

React применяет обновления **последовательно** в порядке их добавления в очередь. Значение-литерал заменяет текущее, функция применяется к результату предыдущего обновления.

---

## Типовые вопросы на собеседовании с ответами

### Q1: Что возвращает useState?
**Ответ:** Массив из двух элементов — текущее значение состояния и функцию для его обновления. Обычно деструктурируется как `const [value, setValue] = useState(initial)`.

### Q2: Является ли setState синхронным?
**Ответ:** Нет, `setState` **асинхронный**. Он не меняет переменную мгновенно, а планирует обновление. React батчит несколько `setState` в один ре-рендер для производительности.

### Q3: Почему нельзя мутировать состояние напрямую?
**Ответ:** React сравнивает состояния **по ссылке**. Если ссылка не изменилась — React не увидит изменений и не запустит ре-рендер. Всегда нужно создавать новый объект/массив.

### Q4: В чём разница между `setState(value)` и `setState(prev => newValue)`?
**Ответ:**
- `setState(value)` — устанавливает конкретное значение
- `setState(prev => newValue)` — функциональное обновление, получает предыдущее состояние

Функциональная форма обязательна, когда новое состояние зависит от предыдущего, особенно в `setTimeout`, `async` функциях и при нескольких `setState` подряд.

### Q5: Что такое stale closure в контексте useState?
**Ответ:** Когда функция (например, колбэк в `setTimeout` или `useEffect`) захватывает устаревшее значение state из-за замыкания. Решается через функциональные обновления или правильные зависимости.

### Q6: Можно ли вызывать useState условно?
**Ответ:** **Нет.** Хуки должны вызываться в одинаковом порядке при каждом рендере. React хранит состояния в связном списке, и условный вызов собьёт порядок. Используйте early return или вынесите условие внутрь состояния.

### Q7: Как сбросить состояние компонента?
**Ответ:**
1. Вызвать `setState(initialValue)` с начальным значением
2. Сменить `key` у компонента — React уничтожит и пересоздаст его целиком

### Q8: Когда использовать useState, а когда useReducer?
**Ответ:**
- `useState` — простое состояние, 1-2 независимых значения
- `useReducer` — сложное состояние, nextState зависит от prevState, несколько полей обновляются вместе, нужна сложная логика переходов

### Q9: Что будет, если передать то же самое значение в setState?
**Ответ:** React использует `Object.is` для сравнения. Если новое значение равно текущему — ре-рендер **не произойдёт** (bailout). Это важная оптимизация.

### Q10: Можно ли использовать useState с классами/функциями?
**Ответ:** Технически можно, но **не рекомендуется**. Классы и функции не сериализуются, их сравнение идёт по ссылке. Для дат храните timestamp, для сложных структур используйте `useReducer` или специализированные хуки.

### Q11: Почему при setState в цикле состояние обновляется только один раз?
**Ответ:** Из-за batching. React объединяет все обновления в одном обработчике в один ре-рендер. Если нужен кумулятивный эффект — используйте функциональные обновления `setCount(prev => prev + 1)`.

### Q12: В чём разница между useState и useRef?
**Ответ:**
- `useState` вызывает ре-рендер при изменении, `useRef` — нет
- Оба сохраняют значение между рендерами
- `useRef` мутабелен (`ref.current = ...`), state обновляется только через setter
- `useRef` используется для DOM-ссылок, таймеров, хранения предыдущих значений

### Q13: Как работает lazy initialization в useState?
**Ответ:** Если передать функцию `useState(() => compute())`, она вызовется **только при первом рендере**. Это экономит производительность при дорогих вычислениях (чтение localStorage, парсинг JSON, тяжёлые математические операции).

### Q14: Почему useState не работает в обычных функциях?
**Ответ:** Хуки работают только внутри функциональных компонентов React и кастомных хуков. React привязывает состояние к fiber-узлу компонента через текущий контекст выполнения (текущий рендерящийся компонент).

### Q15: Как отладить, почему state не обновляется?
**Ответ:**
1. Проверить, не мутируете ли вы state (нужен новый объект)
2. Использовать функциональное обновление
3. Вывести `console.log` сразу после setState — увидите старое значение
4. Вывести state прямо в JSX — увидите актуальное после ре-рендера
5. Использовать React DevTools для отслеживания обновлений

---

## Частые подводные камни (gotchas)

### 1. Бесконечный цикл в useEffect

```typescript
// ❌ ОШИБКА: setState внутри useEffect без зависимостей
useEffect(() => {
  setCount(count + 1);  // 💥 бесконечный ре-рендер
});

// ❌ ОШИБКА: объект/массив как зависимость
useEffect(() => {
  setData({ ... });
}, [config]);  // config пересоздаётся каждый рендер → бесконечный цикл

// ✅ ПРАВИЛЬНО
useEffect(() => {
  setCount(c => c + 1);
}, []);  // выполнится один раз

useEffect(() => {
  setData({ ... });
}, [config.theme]);  // примитив как зависимость
```

### 2. Stale state в async функциях

```typescript
// ❌ ОШИБКА
const handleClick = async () => {
  setCount(count + 1);          // count = 0
  await fetch("/api");
  setCount(count + 1);          // всё ещё count = 0! Итог: 1, а не 2
};

// ✅ ПРАВИЛЬНО
const handleClick = async () => {
  setCount(c => c + 1);
  await fetch("/api");
  setCount(c => c + 1);         // теперь c = 1, итог: 2
};
```

### 3. Забывание про dependencies в useCallback/useMemo

```typescript
// ❌ count будет «заморожен» на значении первого рендера
const increment = useCallback(() => {
  setCount(count + 1);
}, []);  // забыли указать count

// ✅ Правильно
const increment = useCallback(() => {
  setCount(c => c + 1);
}, []);  // функциональное обновление — зависимости не нужны
```

### 4. Мутация объекта state

```typescript
// ❌
const [user, setUser] = useState({ name: "", age: 0 });
user.name = "Иван";       // мутация!
setUser(user);            // React не увидит изменений

// ✅
setUser(prev => ({ ...prev, name: "Иван" }));
```

### 5. setState внутри render (без условия)

```typescript
// ❌ Бесконечный цикл
function Component() {
  const [x, setX] = useState(0);
  if (x < 10) setX(x + 1);  // 💥
  return <p>{x}</p>;
}

// ✅ Использовать useEffect или обработчик события
```

### 6. Лишнее состояние (derived state)

```typescript
// ❌ Хранить в state то, что можно вычислить
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);
// и синхронизировать через useEffect

// ✅ Вычислять при рендере
const total = items.reduce((sum, i) => sum + i.price, 0);
// или useMemo для дорогих вычислений
```

### 7. Использование Date в useState

```typescript
// ❌ Date не сериализуется, сравнение по ссылке
const [date, setDate] = useState(new Date());
// при попытке сохранить в localStorage или передать по сети — проблемы

// ✅ Хранить timestamp
const [timestamp, setTimestamp] = useState(Date.now());
const date = new Date(timestamp);
```

### 8. Неправильная работа с булевыми флагами

```typescript
// ❌ Toggle с зависимостью от текущего state без functional update
const toggle = () => setIsOpen(!isOpen);  // может сломаться в async

// ✅
const toggle = () => setIsOpen(prev => !prev);
```

### 9. Начальное значение пересоздаётся каждый рендер

```typescript
// ❌ getDefaultState() вызывается при каждом рендере (но используется только 1 раз)
const [state, setState] = useState(getDefaultState());

// ✅ Ленивая инициализация
const [state, setState] = useState(() => getDefaultState());
```

### 10. Попытка использовать useState вне компонента

```typescript
// ❌ Ошибка
const [count, setCount] = useState(0);
function MyComponent() { ... }

// ✅ Только внутри компонента или кастомного хука
function MyComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

---

## useState vs useReducer — когда что использовать

### Используйте **useState**, когда:

- ✅ Состояние простое (примитивы, небольшие объекты)
- ✅ Обновления независимы
- ✅ nextState не зависит сложным образом от prevState
- ✅ Логика обновления тривиальна

```typescript
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
const [name, setName] = useState("");
```

### Используйте **useReducer**, когда:

- ✅ Сложное состояние с несколькими полями
- ✅ nextState зависит от prevState сложным образом
- ✅ Несколько действий (actions) с разной логикой
- ✅ Нужна централизованная логика обновления
- ✅ Хочется тестировать логику отдельно от компонента
- ✅ Глубоко вложенные обновления

```typescript
type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset" }
  | { type: "set"; payload: number };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment": return state + 1;
    case "decrement": return state - 1;
    case "reset": return 0;
    case "set": return action.payload;
  }
}

const [count, dispatch] = useReducer(reducer, 0);
```

### Пример сложного состояния:

```typescript
// ❌ Несколько useState, сложно поддерживать
const [data, setData] = useState(null);
const [error, setError] = useState(null);
const [isLoading, setIsLoading] = useState(false);

// ✅ useReducer — единая машина состояний
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Data }
  | { status: "error"; error: Error };

const [state, dispatch] = useReducer(reducer, { status: "idle" });
```

---

## Чек-лист перед собеседованием

### Junior
- [ ] Понимаю базовый синтаксис `const [value, setValue] = useState(initial)`
- [ ] Умею работать с примитивами (string, number, boolean)
- [ ] Понимаю, почему нельзя мутировать объекты/массивы
- [ ] Знаю правильные способы обновления массивов (`filter`, `map`, spread)
- [ ] Понимаю разницу между `useState(value)` и `useState(() => value)`
- [ ] Умею типизировать state в TypeScript

### Middle
- [ ] Понимаю асинхронность setState и batching
- [ ] Уверенно использую функциональные обновления `setState(prev => ...)`
- [ ] Знаю про stale closure problem и как её решать
- [ ] Понимаю automatic batching в React 18
- [ ] Умею писать кастомные хуки на основе useState
- [ ] Знаю, когда использовать несколько useState vs один объект
- [ ] Понимаю разницу между useState и useRef

### Senior
- [ ] Понимаю внутреннее устройство (fiber, hooks linked list, queue)
- [ ] Знаю про derived state и когда НЕ использовать useState
- [ ] Умею выбирать между useState и useReducer
- [ ] Понимаю bailout-оптимизацию (Object.is сравнение)
- [ ] Знаю про flushSync и когда его применять
- [ ] Понимаю все правила хуков и почему они такие
- [ ] Умею отлаживать сложные проблемы с состоянием
- [ ] Понимаю взаимодействие useState с useEffect/useMemo/useCallback
- [ ] Знаю продвинутые TypeScript-паттерны (discriminated unions для UI-состояний)
- [ ] Понимаю, как правильно синхронизировать state с props

---

## 🎯 Финальные советы

1. **setState асинхронный** — никогда не читайте state сразу после setState
2. **Функциональные обновления** — используйте, когда новое значение зависит от старого
3. **Не мутируйте** — всегда создавайте новые объекты/массивы
4. **Избегайте derived state** — вычисляйте значения при рендере
5. **Используйте key для сброса** — когда нужно полностью пересоздать компонент
6. **Ленивая инициализация** — для дорогих вычислений
7. **Правила хуков** — не вызывайте условно, в циклах, вне компонентов

---

> **Автор заметки:** этот гайд покрывает ~95% вопросов по `useState` на собеседованиях. Для полного понимания React также изучите `useEffect`, `useReducer`, `useMemo`, `useCallback`, `useRef` — они тесно связаны с управлением состоянием.

Удачи на собеседовании! 🚀
