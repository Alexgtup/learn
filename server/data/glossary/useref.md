---
term: useRef
aliases: 
---
# 📘 Полный гайд по useRef для собеседований

Исчерпывающий справочник по хуку `useRef` в React. Материал разбит на **три уровня сложности** (Junior → Middle → Senior), с примерами кода, TypeScript-типизацией, частыми вопросами на собеседованиях и подводными камнями.

---

## 📋 Содержание

- [Введение: что такое useRef?](#введение-что-такое-useref)
- [Уровень 1 — Junior (Основы)](#уровень-1--junior-основы)
- [Уровень 2 — Middle (Уверенное владение)](#уровень-2--middle-уверенное-владение)
- [Уровень 3 — Senior (Продвинутые паттерны)](#уровень-3--senior-продвинутые-паттерны)
- [Типовые вопросы на собеседовании с ответами](#типовые-вопросы-на-собеседовании-с-ответами)
- [Частые подводные камни (gotchas)](#частые-подводные-камни-gotchas)
- [useRef vs useState — когда что использовать](#useref-vs-usestate--когда-что-использовать)
- [Чек-лист перед собеседованием](#чек-лист-перед-собеседованием)

---

## Введение: что такое useRef?

`useRef` — это хук React, который создаёт **мутируемый объект-контейнер**, ссылка на который **сохраняется между рендерами**, но **изменение его свойства `current` не вызывает ре-рендер**.

**Сигнатура:**
```typescript
const ref = useRef<T>(initialValue);
// ref: { current: T }
```

**Два основных сценария использования:**

1. **Доступ к DOM-элементам** — прямой способ работать с разметкой
2. **Хранение произвольных мутируемых значений** между рендерами (аналог instance-переменных в классах)

**Ключевые факты:**
- Возвращает **один и тот же объект** при каждом рендере (стабильная ссылка)
- Изменение `ref.current` **НЕ вызывает ре-рендер**
- Значение `current` мутабельно — можно менять в любое время
- Работает только после монтирования (DOM-refs) или после присвоения
- React «знает» про ref-объект и обрабатывает его особым образом при передаче в JSX

---

## Уровень 1 — Junior (Основы)

### 1.1 Базовое использование — доступ к DOM

```typescript
import { useRef, useEffect } from "react";

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();  // безопасный вызов через optional chaining
  };

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Введите текст" />
      <button onClick={focusInput}>Фокус</button>
    </div>
  );
}
```

**Что здесь происходит:**
1. `useRef<HTMLInputElement>(null)` создаёт объект `{ current: null }`
2. React после монтирования присваивает `inputRef.current = <DOM-элемент>`
3. При клике на кнопку вызываем `focus()` на реальном DOM-элементе

### 1.2 Типизация DOM-refs в TypeScript

Это **самый частый вопрос у Junior-разработчиков**:

```typescript
// ✅ input — всегда null до монтирования, потом HTMLInputElement
const inputRef = useRef<HTMLInputElement>(null);

// ✅ div
const divRef = useRef<HTMLDivElement>(null);

// ✅ video
const videoRef = useRef<HTMLVideoElement>(null);

// ✅ canvas
const canvasRef = useRef<HTMLCanvasElement>(null);

// ✅ textarea
const textareaRef = useRef<HTMLTextAreaElement>(null);

// ✅ select
const selectRef = useRef<HTMLSelectElement>(null);
```

**Правило:** тип всегда `<HTMLXxxElement>`, а начальное значение — `null`. TypeScript понимает, что `current` может быть `null`, поэтому используйте `?.` или проверку.

### 1.3 Чтение значения из input

```typescript
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (inputRef.current) {
      console.log(inputRef.current.value);  // читаем значение без state
    }
  };

  return (
    <div>
      <input ref={inputRef} defaultValue="Привет" />
      <button onClick={handleSubmit}>Отправить</button>
    </div>
  );
}
```

**Это называется «неконтролируемый компонент»** — React не управляет значением input, мы читаем его напрямую.

### 1.4 Прокрутка к элементу

```typescript
function ScrollToSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollTo = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <button onClick={scrollTo}>Перейти к секции</button>
      <div style={{ height: "2000px" }}>Промежуточный контент</div>
      <div ref={sectionRef}>Целевая секция</div>
    </>
  );
}
```

### 1.5 Автоматический фокус при монтировании

```typescript
function AutofocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);  // пустой массив — выполнится один раз после монтирования

  return <input ref={inputRef} type="text" />;
}
```

### 1.6 Хранение простых значений между рендерами

```typescript
function RenderCounter() {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`Рендер №${renderCount.current}`);
  });  // без зависимостей — срабатывает после каждого рендера

  return <p>Компонент</p>;
}
```

**Важно:** изменение `renderCount.current` **не вызывает ре-рендер**. Это отличает `useRef` от `useState`.

### 1.7 Работа с setInterval / setTimeout

```typescript
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={stop}>Стоп</button>
    </div>
  );
}
```

**Зачем useRef для интервала?** Потому что ID интервала нам не нужно отображать в UI, но мы должны иметь доступ к нему между рендерами, чтобы потом очистить.

---

## Уровень 2 — Middle (Уверенное владение)

### 2.1 useRef vs useState — фундаментальное различие

```typescript
function Comparison() {
  const [stateValue, setStateValue] = useState(0);
  const refValue = useRef(0);

  const update = () => {
    setStateValue(v => v + 1);  // ✅ вызовет ре-рендер
    refValue.current += 1;       // ❌ НЕ вызовет ре-рендер
    console.log("state:", stateValue, "ref:", refValue.current);
    // state: 0 (старое значение!), ref: 1 (актуальное)
  };

  return (
    <div>
      <p>State: {stateValue}</p>
      <p>Ref: {refValue.current}</p>  {/* НЕ обновится автоматически! */}
      <button onClick={update}>Обновить</button>
    </div>
  );
}
```

**Ключевые выводы:**

| Критерий | `useState` | `useRef` |
|---|---|---|
| Вызывает ре-рендер | ✅ Да | ❌ Нет |
| Сохраняется между рендерами | ✅ Да | ✅ Да |
| Мутабельность | Только через setter | Прямое изменение `.current` |
| Значение в текущем рендере | Заморожено | Актуальное (всегда) |
| Для чего | UI-данные | Служебные данные, DOM |

### 2.2 Избавление от stale closure

**Классическая проблема:**

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);  // ❌ всегда 0 из-за stale closure
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{count}</p>;
}
```

**Решение через useRef:**

```typescript
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // Синхронизируем ref с актуальным count
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(countRef.current);  // ✅ всегда актуальное значение
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{count}</p>;
}
```

### 2.3 Хук usePrevious на основе useRef

```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });  // обновляется после каждого рендера

  return ref.current;  // возвращает значение из предыдущего рендера
}

function Demo() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <p>
      Текущий: {count}, предыдущий: {prevCount ?? "нет"}
    </p>
  );
}
```

**Почему это работает:**
1. Первый рендер: `ref.current = undefined`, возвращаем `undefined`, затем в `useEffect` записываем `0`
2. Второй рендер (после обновления count): `ref.current = 0` (сохранилось с прошлого useEffect), возвращаем его
3. После рендера useEffect снова обновляет `ref.current` до нового значения

### 2.4 Хранение «последнего» колбэка (latest ref pattern)

Очень мощный паттерн для работы с event-листенерами и таймерами:

```typescript
function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  // Обновляем ref при каждом рендере — всегда актуальная версия функции
  useEffect(() => {
    ref.current = fn;
  });

  // Возвращаем стабильную функцию, которая всегда вызывает актуальную
  return useCallback((...args: any[]) => {
    return ref.current(...args);
  }, []) as T;
}

function Demo() {
  const [count, setCount] = useState(0);

  const onClick = useEventCallback(() => {
    console.log(count);  // ✅ всегда актуальный count
  });

  useEffect(() => {
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [onClick]);  // onClick стабилен — добавляем listener один раз
}
```

### 2.5 Callback Refs (альтернатива useRef)

```typescript
function CallbackRefDemo() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  // Callback ref — функция, вызываемая при монтировании/размонтировании
  const callbackRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      // монтирование
      element.focus();
    } else {
      // размонтирование
    }
  }, []);

  return <div ref={callbackRef}>Текст</div>;
}
```

**Когда callback ref лучше, чем useRef:**
- ✅ Нужна логика при монтировании/размонтировании DOM-элемента
- ✅ Refs в динамических списках
- ✅ Измерение размеров элемента при появлении
- ✅ Интеграция со сторонними библиотеками (D3, GSAP, Leaflet)

```typescript
// Измерение размеров элемента
function MeasureBox() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const rect = node.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
  }, []);

  return (
    <div>
      <div ref={measureRef} style={{ width: "50%", padding: "20px" }}>
        Контент
      </div>
      <p>Размеры: {size.width}x{size.height}</p>
    </div>
  );
}
```

### 2.6 Refs в списках (Map of refs)

```typescript
function ListWithRefs() {
  const itemsRef = useRef<Map<number, HTMLLIElement>>(new Map());

  const scrollToItem = (id: number) => {
    const node = itemsRef.current.get(id);
    node?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <ul>
      {[1, 2, 3, 4, 5].map(id => (
        <li
          key={id}
          ref={(node) => {
            if (node) {
              itemsRef.current.set(id, node);
            } else {
              itemsRef.current.delete(id);  // cleanup при размонтировании
            }
          }}
        >
          Элемент {id}
          <button onClick={() => scrollToItem(id)}>К элементу {id}</button>
        </li>
      ))}
    </ul>
  );
}
```

**Альтернатива — массив refs:**

```typescript
function ListItems() {
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 2.7 forwardRef — передача ref в дочерний компонент

По умолчанию `ref` нельзя передать как обычный prop. Нужен `forwardRef`:

```typescript
import { forwardRef, useRef, useImperativeHandle } from "react";

// Дочерний компонент
const CustomInput = forwardRef<HTMLInputElement, { label: string }>(
  function CustomInput({ label }, ref) {
    return (
      <label>
        {label}
        <input ref={ref} type="text" />
      </label>
    );
  }
);

// Родительский компонент
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => inputRef.current?.focus();

  return (
    <div>
      <CustomInput label="Имя:" ref={inputRef} />
      <button onClick={focus}>Фокус</button>
    </div>
  );
}
```

**TypeScript-типизация forwardRef:**
```typescript
forwardRef<RefType, PropsType>((props, ref) => { ... })
```

### 2.8 useImperativeHandle — кастомный API для ref

```typescript
interface ModalHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
}

const Modal = forwardRef<ModalHandle, ModalProps>(
  function Modal({ title, children }, ref) {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen(prev => !prev)
    }), []);  // зависимости, если методы используют state/props

    if (!isOpen) return null;

    return (
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    );
  }
);

function App() {
  const modalRef = useRef<ModalHandle>(null);

  return (
    <div>
      <button onClick={() => modalRef.current?.open()}>Открыть</button>
      <button onClick={() => modalRef.current?.close()}>Закрыть</button>
      <Modal ref={modalRef} title="Привет">
        <p>Содержимое модалки</p>
      </Modal>
    </div>
  );
}
```

**Когда использовать:** когда нужно скрыть внутреннюю реализацию и предоставить дочернему компоненту **ограниченный публичный API**.

### 2.9 Работа с Canvas

```typescript
function CanvasDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Рисуем круг
    ctx.beginPath();
    ctx.arc(100, 100, 50, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
  }, []);

  return <canvas ref={canvasRef} width={200} height={200} />;
}
```

### 2.10 Работа с video/audio

```typescript
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  return (
    <div>
      <video ref={videoRef} src={src} controls />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={toggleMute}>Mute</button>
    </div>
  );
}
```

---

## Уровень 3 — Senior (Продвинутые паттерны)

### 3.1 Внутреннее устройство useRef

```typescript
// Упрощённая реализация useRef (концептуально)
function useRef<T>(initialValue: T): MutableRefObject<T> {
  const fiber = getCurrentFiber();
  const hookIndex = getNextHookIndex();

  if (!fiber.hooks[hookIndex]) {
    // Первый рендер — создаём объект
    fiber.hooks[hookIndex] = {
      current: initialValue
    };
  }

  // Возвращаем ОДИН И ТОТ ЖЕ объект при каждом рендере
  return fiber.hooks[hookIndex];
}
```

**Ключевая идея:** `useRef` возвращает **стабильную ссылку** на один и тот же объект. React гарантирует, что объект не меняется между рендерами, меняется только его содержимое (`current`).

### 3.2 Два типа ref-объектов в TypeScript

```typescript
// 1. MutableRefObject — когда current мутабельный
const ref1 = useRef<number>(0);
ref1.current = 5;  // ✅ можно менять

// 2. RefObject — когда current readonly (для DOM)
const ref2 = useRef<HTMLDivElement>(null);
// ref2.current = document.createElement("div");  // ❌ нельзя напрямую

// 3. Если нужно менять DOM-реф вручную — используйте:
const ref3 = useRef<HTMLDivElement | null>(null);
ref3.current = document.createElement("div");  // ✅ можно
```

**Правило TypeScript:** если `initialValue` имеет тот же тип, что и generic (без `| null`) — React считает ref мутабельным. Если `null` входит в тип — readonly.

### 3.3 Создание кастомных хуков с ref

#### useInterval

```typescript
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// Использование
function Counter() {
  const [count, setCount] = useState(0);
  useInterval(() => setCount(c => c + 1), 1000);
  return <p>{count}</p>;
}
```

#### useTimeout

```typescript
function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}
```

#### useLatest

```typescript
function useLatest<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;  // всегда актуально
  return ref;
}

// Использование
function Demo() {
  const [count, setCount] = useState(0);
  const latestCount = useLatest(count);

  useEffect(() => {
    const id = setTimeout(() => {
      console.log(latestCount.current);  // всегда актуальный count
    }, 3000);
    return () => clearTimeout(id);
  }, []);  // зависимости не нужны
}
```

#### useIsMounted

```typescript
function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

// Использование — для избежания setState после unmount
function DataLoader() {
  const [data, setData] = useState(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    fetchData().then(result => {
      if (isMounted.current) {
        setData(result);
      }
    });
  }, []);
}
```

### 3.4 Generic forwardRef компонент

**Классическая проблема:** `forwardRef` «съедает» generic-параметры.

```typescript
// ❌ Так не работает — теряем generic
const List = forwardRef<HTMLDivElement, { items: T[] }>((props, ref) => {});

// ✅ Решение — используем IIFE
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

const List = forwardRef(function List<T>(
  props: ListProps<T>,
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <div ref={ref}>
      {props.items.map((item, i) => (
        <div key={i}>{props.renderItem(item)}</div>
      ))}
    </div>
  );
}) as <T>(
  props: ListProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement;
```

### 3.5 Ref и Concurrent Features (React 18+)

В concurrent mode React может **отменять рендеры** и начинать их заново. Это означает:

```typescript
function Problematic() {
  const countRef = useRef(0);

  // ❌ ОПАСНО: мутация ref во время render-фазы
  countRef.current += 1;

  return <p>{countRef.current}</p>;
}
```

**Правила безопасности:**
- ✅ Мутации ref только в `useEffect` или event-обработчиках
- ❌ Никогда не меняйте ref во время рендера (render phase)
- ✅ Чтение ref во время рендера допустимо, но может вернуть устаревшее значение

### 3.6 Интеграция со сторонними библиотеками

```typescript
import mapboxgl from "mapbox-gl";

function MapComponent({ center }: { center: [number, number] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Инициализация карты один раз
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      center: center,
      zoom: 10
    });

    // Cleanup при размонтировании
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);  // важно: только один раз

  // Реакция на изменение props
  useEffect(() => {
    mapRef.current?.setCenter(center);
  }, [center]);

  return <div ref={containerRef} style={{ height: 400 }} />;
}
```

**Почему так:**
- `containerRef` нужен для доступа к DOM при инициализации
- `mapRef` хранит инстанс карты между рендерами
- Инициализация происходит только один раз (cleanup удаляет карту при unmount)

### 3.7 Ref-объект в зависимостях useEffect

```typescript
// ❌ ref.current в зависимостях НЕ работает
useEffect(() => {
  console.log(ref.current);
}, [ref.current]);  // React не отследит изменение

// ✅ Используйте state или другой механизм для реагирования
```

**Причина:** `ref.current` — мутируемое свойство, React не может отследить его изменение. Если нужно реагировать на изменение — используйте `useState` или callback ref.

### 3.8 Ref vs useState для «служебных» данных

```typescript
// Пример: форма с авто-сохранением
function AutoSaveForm() {
  const [form, setForm] = useState({ name: "", email: "" });
  const lastSavedRef = useRef({ name: "", email: "" });

  useEffect(() => {
    // Сохраняем только если форма изменилась
    if (
      form.name !== lastSavedRef.current.name ||
      form.email !== lastSavedRef.current.email
    ) {
      saveToServer(form);
      lastSavedRef.current = form;  // обновляем «последнее сохранённое»
    }
  }, [form]);
}
```

### 3.9 Performance-оптимизации с ref

```typescript
// Хранение «тяжёлых» объектов без ре-рендера
function HeavyComponent() {
  const cacheRef = useRef<Map<string, any>>(new Map());

  const compute = (key: string) => {
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }

    const result = expensiveComputation(key);
    cacheRef.current.set(key, result);
    return result;
  };

  // ...
}
```

### 3.10 Ref и React DevTools

React DevTools **показывает** ref-объекты, но изменения `current` не триггерят обновления DevTools. Для отладки:

```typescript
// Вывод в консоль при изменении
useEffect(() => {
  console.log("Ref changed:", myRef.current);
});

// Или используйте Proxy для отслеживания
function useTrackedRef<T>(initial: T) {
  const ref = useRef(initial);

  return new Proxy(ref, {
    set(target, prop, value) {
      if (prop === "current") {
        console.log("Ref updated:", value);
      }
      (target as any)[prop] = value;
      return true;
    }
  });
}
```

---

## Типовые вопросы на собеседовании с ответами

### Q1: Что возвращает useRef?
**Ответ:** Объект `{ current: initialValue }`, ссылка на который стабильна между рендерами. Изменение `current` не вызывает ре-рендер.

### Q2: В чём разница между useRef и useState?
**Ответ:**
- `useState` вызывает ре-рендер при изменении, `useRef` — нет
- Оба сохраняют значение между рендерами
- `useRef` мутабелен (прямое изменение `.current`), `useState` — только через setter
- Значение `ref.current` всегда актуальное, значение state — замороженное в текущем рендере

### Q3: Можно ли передавать ref как обычный prop?
**Ответ:** Нет, `ref` — зарезервированное свойство в React. Для передачи ref в дочерний компонент нужно использовать `forwardRef` и опционально `useImperativeHandle` для кастомного API.

### Q4: Что такое callback ref?
**Ответ:** Альтернатива `ref={refObject}`. Передаётся функция `ref={(node) => { ... }}`, которая вызывается при монтировании (с DOM-элементом) и размонтировании (с `null`). Удобна для логики при появлении/исчезновении элемента.

### Q5: Зачем нужен useImperativeHandle?
**Ответ:** Позволяет ограничить публичный API дочернего компонента. Вместо того чтобы давать родителю прямой доступ к DOM или внутренним state, можно экспонировать только нужные методы (`open()`, `close()`, `focus()` и т.п.).

### Q6: Когда использовать useRef вместо useState?
**Ответ:**
- ✅ Когда значение нужно между рендерами, но не для UI
- ✅ Для хранения ID таймеров, инстансов библиотек, DOM-элементов
- ✅ Когда нужна мутабельная переменная без ре-рендеров
- ✅ Для борьбы со stale closure

### Q7: Что будет, если читать ref.current во время рендера?
**Ответ:** Технически работает, но может вернуть устаревшее значение (из предыдущего рендера, если ref обновлялся в useEffect). Мутации ref во время render-фазы **опасны** в concurrent mode.

### Q8: Можно ли использовать useRef вне компонента?
**Ответ:** Нет. Как и любой хук, `useRef` работает только внутри функциональных компонентов или кастомных хуков. React привязывает хуки к fiber-узлу компонента.

### Q9: Как правильно типизировать ref для input?
**Ответ:** `useRef<HTMLInputElement>(null)`. Тип — `HTMLXxxElement`, начальное значение — `null`. При использовании — `inputRef.current?.focus()` или проверка на `null`.

### Q10: Почему нельзя использовать ref.current в зависимостях useEffect?
**Ответ:** React отслеживает изменения по ссылке. `ref` — один и тот же объект всегда, а `ref.current` меняется через мутацию, которую React не может отследить. Используйте `useState` для значений, на которые нужно реагировать.

### Q11: Как хранить несколько refs в списке?
**Ответ:** Используйте `Map` или массив:
- Map: `useRef<Map<number, HTMLElement>>(new Map())` + callback ref с `set`/`delete`
- Массив: `useRef<(HTMLElement | null)[]>([])` + callback ref с индексом

### Q12: Что такое stale closure и как с ним бороться через useRef?
**Ответ:** Stale closure — когда функция захватывает устаревшее значение из-за замыкания. Решение: создать ref, синхронизировать его с актуальным значением в useEffect и использовать `ref.current` внутри колбэка.

### Q13: Что такое forwardRef и зачем он нужен?
**Ответ:** HOC (точнее, утилита), позволяющая пробросить ref через промежуточный компонент к внутреннему DOM-элементу или другому ref. Необходим, потому что `ref` нельзя передать как обычный prop.

### Q14: В чём разница между legacy string refs, createRef и useRef?
**Ответ:**
- String refs (`ref="myRef"`) — **устарели и удалены**, не использовать
- `createRef()` — для классовых компонентов, создаёт новый ref при каждом рендере
- `useRef()` — для функциональных компонентов, возвращает стабильный объект между рендерами

### Q15: Можно ли использовать useRef для управления UI?
**Ответ:** Технически можно (например, `ref.current.innerText = ...`), но это **антипаттерн**. React использует декларативный подход — UI должно быть функцией от state. Прямые мутации DOM ломают эту модель и ведут к багам.

---

## Частые подводные камни (gotchas)

### 1. Попытка использовать ref.current для ре-рендера

```typescript
// ❌ НЕ РАБОТАЕТ: изменения ref не вызывают ре-рендер
function Counter() {
  const count = useRef(0);

  const increment = () => {
    count.current += 1;
    // UI не обновится!
  };

  return <p>{count.current}</p>;
}

// ✅ Для UI нужен useState
function Counter() {
  const [count, setCount] = useState(0);
  return <p>{count}</p>;
}
```

### 2. Забывание optional chaining

```typescript
// ❌ Возможно null
const focus = () => inputRef.current.focus();

// ✅ Безопасно
const focus = () => inputRef.current?.focus();
```

### 3. Мутация ref во время render-фазы

```typescript
// ❌ ОПАСНО в concurrent mode
function Component() {
  const renderCount = useRef(0);
  renderCount.current += 1;  // мутация во время render!
  return <p>{renderCount.current}</p>;
}

// ✅ Безопасно — в useEffect
function Component() {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
  });
  return <p>Компонент</p>;
}
```

### 4. Неправильная типизация для мутабельных refs

```typescript
// ❌ current будет readonly
const ref1 = useRef<HTMLDivElement>(null);
ref1.current = someElement;  // Ошибка TypeScript

// ✅ current мутабельный
const ref2 = useRef<HTMLDivElement | null>(null);
ref2.current = someElement;  // ОК
```

### 5. Создание нового ref при каждом рендере

```typescript
// ❌ ref пересоздаётся каждый рендер (потеря значения)
function Bad() {
  const createMyRef = () => useRef(0);  // плохо
  const ref = createMyRef();
}

// ✅ ref создаётся один раз
function Good() {
  const ref = useRef(0);
}
```

### 6. Использование ref в зависимостях useEffect

```typescript
// ❌ Бесполезно — ссылка на ref не меняется
useEffect(() => {
  doSomething(myRef.current);
}, [myRef]);

// ✅ Если нужна реакция на изменение — используйте state или callback ref
```

### 7. Передача ref в обычный компонент

```typescript
// ❌ Ошибка: ref не передастся в MyInput
function Parent() {
  const ref = useRef(null);
  return <MyInput ref={ref} />;  // не сработает
}

// ✅ Нужно использовать forwardRef
const MyInput = forwardRef((props, ref) => (
  <input ref={ref} />
));
```

### 8. Refs в условном рендеринге

```typescript
// ⚠️ ref.current будет null, пока элемент не в DOM
function ConditionalRef() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Может быть null, если show = false
    console.log(ref.current);
  });

  return show ? <div ref={ref}>Видно</div> : null;
}
```

### 9. Очищать ref при unmount

```typescript
// ✅ Хорошая практика — очистка внешних ресурсов
useEffect(() => {
  const instance = new ThirdPartyLibrary(containerRef.current);
  instanceRef.current = instance;

  return () => {
    instance.destroy();
    instanceRef.current = null;  // очистка
  };
}, []);
```

### 10. Confusion между ref-объектом и ref-значением

```typescript
// ref — это сам объект
const ref = useRef(0);
console.log(ref);          // { current: 0 }
console.log(ref.current);  // 0

// Нельзя деструктурировать!
// const { current } = useRef(0);  // ❌ потеряете связь
```

---

## useRef vs useState — когда что использовать

### Используйте **useState**, когда:

- ✅ Значение нужно отображать в UI
- ✅ Изменение значения должно вызывать ре-рендер
- ✅ Значение является частью состояния приложения
- ✅ Данные иммутабельны (нужен новый объект при изменении)

```typescript
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);
const [isOpen, setIsOpen] = useState(false);
```

### Используйте **useRef**, когда:

- ✅ Значение нужно хранить между рендерами, но не в UI
- ✅ Изменение не должно вызывать ре-рендер
- ✅ Нужен доступ к DOM-элементу
- ✅ Нужна мутабельная переменная (аналог instance-переменных в классах)
- ✅ Хранение ID таймеров, инстансов библиотек, prev-значений

```typescript
const inputRef = useRef<HTMLInputElement>(null);
const intervalRef = useRef<number | null>(null);
const renderCount = useRef(0);
const prevValue = useRef<Value | undefined>();
```

### Сравнительная таблица

| Критерий | `useState` | `useRef` |
|---|---|---|
| Вызывает ре-рендер | ✅ Да | ❌ Нет |
| Сохраняется между рендерами | ✅ Да | ✅ Да |
| Мутабельность | ❌ Только через setter | ✅ Прямое изменение |
| Значение в текущем рендере | Заморожено | Всегда актуально |
| Для UI-данных | ✅ Да | ❌ Нет |
| Для DOM-доступа | ❌ Нет | ✅ Да |
| Для таймеров/инстансов | ❌ Плохо | ✅ Идеально |
| Для prev-значений | Сложно | ✅ Просто |
| Работает в concurrent mode | ✅ Да | ⚠️ Мутации только в effects |

### Пример — комбинация обоих

```typescript
function DebouncedSearch() {
  const [query, setQuery] = useState("");           // для UI
  const timeoutRef = useRef<number | null>(null);   // служебное
  const lastQueryRef = useRef("");                   // prev-значение

  const handleChange = (value: string) => {
    setQuery(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      if (value !== lastQueryRef.current) {
        performSearch(value);
        lastQueryRef.current = value;
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return <input value={query} onChange={e => handleChange(e.target.value)} />;
}
```

---

## Чек-лист перед собеседованием

### Junior
- [ ] Понимаю базовый синтаксис `useRef(initialValue)`
- [ ] Умею использовать ref для доступа к DOM-элементам
- [ ] Знаю правильную TypeScript-типизацию (`useRef<HTMLXxxElement>(null)`)
- [ ] Понимаю, что `ref.current` может быть `null` (использую `?.`)
- [ ] Умею фокусировать input, прокручивать к элементу
- [ ] Знаю, что изменение ref НЕ вызывает ре-рендер
- [ ] Умею хранить ID таймеров в ref

### Middle
- [ ] Понимаю фундаментальные отличия useRef vs useState
- [ ] Умею писать кастомный хук `usePrevious`
- [ ] Знаю про callback refs и когда их использовать
- [ ] Умею работать с refs в списках (Map или массив)
- [ ] Понимаю `forwardRef` и как его типизировать
- [ ] Знаю `useImperativeHandle` для кастомного API
- [ ] Умею решать stale closure через useRef
- [ ] Понимаю latest ref pattern
- [ ] Знаю, почему нельзя использовать `ref.current` в зависимостях useEffect

### Senior
- [ ] Понимаю внутреннее устройство useRef (fiber, hook slot)
- [ ] Знаю правила безопасности в concurrent mode
- [ ] Умею создавать generic forwardRef компоненты
- [ ] Понимаю разницу между MutableRefObject и RefObject
- [ ] Умею интегрировать сторонние библиотеки через ref
- [ ] Знаю продвинутые паттерны: useInterval, useTimeout, useLatest, useIsMounted
- [ ] Понимаю, когда НЕ использовать ref (нарушение декларативности)
- [ ] Знаю про cleanup refs при unmount
- [ ] Понимаю оптимизации с помощью ref (кэширование, хранение инстансов)
- [ ] Умею отлаживать проблемы с refs (DevTools, console.log)

---

## 🎯 Финальные советы

1. **useRef — это «карман» компонента** — храни там то, что нужно между рендерами, но не для UI
2. **Изменение ref не триггерит ре-рендер** — это и плюс (производительность), и минус (нет реактивности)
3. **Всегда проверяйте null** — `ref.current?.method()` или явная проверка
4. **Callback refs — мощный инструмент** — используйте при динамическом DOM
5. **forwardRef обязателен** при пробросе ref в дочерние компоненты
6. **useImperativeHandle** — для чистого публичного API
7. **Не мутируйте ref во время render-фазы** — особенно важно в React 18+
8. **Очищайте внешние ресурсы** в cleanup функции useEffect
9. **Правильно типизируйте** — `HTMLXxxElement` для DOM, конкретный тип для значений

---

> **Автор заметки:** этот гайд покрывает ~95% вопросов по `useRef` на собеседованиях. Для полного понимания React хуков также изучите `useState`, `useEffect`, `useReducer`, `useMemo`, `useCallback` — они тесно связаны между собой.

Удачи на собеседовании! 🚀
