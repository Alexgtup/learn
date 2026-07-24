---
term: TypeScript
aliases: 
---
# 📘 Полный гайд по TypeScript для собеседований

Исчерпывающий справочник для подготовки к собеседованиям по TypeScript. Материал разбит на **три уровня сложности** (Junior → Middle → Senior), чтобы каждый мог начать с комфортной точки и постепенно углубляться.

---

## 📋 Содержание

- [Введение: зачем вообще TypeScript?](#введение-зачем-вообще-typescript)
- [Уровень 1 — Junior (Основы)](#уровень-1--junior-основы)
- [Уровень 2 — Middle (Уверенное владение)](#уровень-2--middle-уверенное-владение)
- [Уровень 3 — Senior (Продвинутые паттерны)](#уровень-3--senior-продвинутые-паттерны)
- [Типовые вопросы на собеседовании с ответами](#типовые-вопросы-на-собеседовании-с-ответами)
- [Частые подводные камни (gotchas)](#частые-подводные-камни-gotchas)
- [Настройка tsconfig — что важно знать](#настройка-tsconfig--что-важно-знать)
- [Чек-лист перед собеседованием](#чек-лист-перед-собеседованием)

---

## Введение: зачем вообще TypeScript?

TypeScript — это **надмножество JavaScript**, добавляющее статическую типизацию. Код на TS компилируется в обычный JS, поэтому TS не работает «в браузере» напрямую — только после транспиляции.

**Ключевые преимущества:**
- Раннее обнаружение ошибок (на этапе компиляции, а не в рантайме)
- Улучшенный автокомплит и рефакторинг в IDE
- Самодокументируемый код (типы — это живая документация)
- Более безопасный рефакторинг больших проектов

**Главное отличие от JS:** в JS тип переменной определяется в момент выполнения (dynamic typing), в TS — во время компиляции (static typing).

---

## Уровень 1 — Junior (Основы)

### 1.1 Примитивные типы

```typescript
let name: string = "Анна";
let age: number = 25;            // number — и для целых, и для дробных
let isStudent: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let id: symbol = Symbol("id");
let big: bigint = 100n;
```

**Вопрос-ловушка:** чем отличаются `null` и `undefined`?
- `undefined` — значение не присвоено (переменная объявлена, но значения нет)
- `null` — явное «ничего», пустая ссылка

### 1.2 Специальные типы: `any`, `unknown`, `never`, `void`

Это **самый частый вопрос** на junior-собеседованиях.

#### `any` — «выключить проверку типов»

```typescript
let data: any = 42;
data = "теперь строка";     // ✅ ОК
data.foo.bar.baz;           // ✅ компилятор молчит, но в рантайме — ошибка
```

**Когда использовать:** только при миграции с JS или работе со сторонними библиотеками без типов. В новом коде — **избегать**.

#### `unknown` — «безопасный any»

```typescript
let data: unknown = 42;
data.toUpperCase();          // ❌ Ошибка! Сначала нужно проверить тип

if (typeof data === "string") {
  data.toUpperCase();        // ✅ ОК, компилятор понял что это string
}
```

**Правило:** перед использованием `unknown` нужно **сузить тип** (type narrowing).

#### `void` — «функция ничего не возвращает»

```typescript
function log(message: string): void {
  console.log(message);
  // return 42;  // ❌ нельзя
}
```

#### `never` — «значение, которого не бывает»

```typescript
function throwError(msg: string): never {
  throw new Error(msg);      // функция всегда выбрасывает исключение
}

function infiniteLoop(): never {
  while (true) {}            // функция никогда не завершится
}
```

> **Шпаргалка:**
> | Тип | Значение |
> |---|---|
> | `any` | Любое, проверки отключены |
> | `unknown` | Любое, но нужен type guard перед использованием |
> | `void` | Отсутствие возвращаемого значения |
> | `never` | Значение, которое никогда не возникнет |

### 1.3 Массивы и кортежи (Tuples)

```typescript
// Массив
let nums: number[] = [1, 2, 3];
let strs: Array<string> = ["a", "b"];   // аналогично, через generic

// Кортеж — массив фиксированной длины с известными типами
let user: [number, string] = [1, "Иван"];
user[0] = 2;          // ✅ ОК
user[1] = "Пётр";     // ✅ ОК
// user[2] = true;    // ❌ тип не совпадает

// Именованный кортеж (с TS 4.0)
let point: [x: number, y: number] = [10, 20];
```

### 1.4 `interface` vs `type` — вечный вопрос

```typescript
// Через interface
interface User {
  id: number;
  name: string;
}

// Через type
type UserType = {
  id: number;
  name: string;
};
```

**Главные отличия:**

| Возможность | `interface` | `type` |
|---|---|---|
| Описание объекта | ✅ | ✅ |
| Расширение (extends) | ✅ | ✅ (через `&`) |
| Declaration merging (слияние) | ✅ | ❌ |
| Union-типы | ❌ | ✅ |
| Примитивные алиасы | ❌ | ✅ |
| Mapped types | ❌ | ✅ |

```typescript
// Declaration merging — только у interface
interface Animal { name: string; }
interface Animal { age: number; }   // ✅ сольются в одно
const a: Animal = { name: "Rex", age: 5 };

// Union — только через type
type Status = "active" | "banned";  // ✅

// Пересечение
type Admin = User & { role: "admin" };
```

> **Правило хорошего тона:** для описания формы объекта — `interface`, для всего остального — `type`.

### 1.5 Опциональные поля и `readonly`

```typescript
interface Product {
  readonly id: number;    // нельзя изменить после создания
  name: string;
  description?: string;   // опциональное поле (= string | undefined)
}

const p: Product = { id: 1, name: "Телефон" };
// p.id = 2;               // ❌ readonly
p.description = "Крутой"; // ✅
```

### 1.6 Функции и их типы

```typescript
// Полный синтаксис
function add(a: number, b: number): number {
  return a + b;
}

// Значения по умолчанию
function greet(name: string = "Гость"): string {
  return `Привет, ${name}`;
}

// Rest-параметры
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

// Перегрузка функций (overloads)
function parse(x: string): number;
function parse(x: number): string;
function parse(x: string | number): string | number {
  if (typeof x === "string") return parseInt(x);
  return x.toString();
}
```

### 1.7 Union и Intersection типы

```typescript
// Union — «или»
type ID = string | number;
let userId: ID = 42;
userId = "abc-123";

// Intersection — «и» (слияние)
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;
const p: Person = { name: "Олег", age: 30 };
```

**Важно про Union:** при использовании union доступны только **общие** члены:

```typescript
type Dog = { bark(): void; name: string };
type Cat = { meow(): void; name: string };
type Animal = Dog | Cat;

function handle(a: Animal) {
  a.name;     // ✅ ОК — есть у обоих
  // a.bark(); // ❌ Ошибка — bark есть только у Dog
}
```

### 1.8 Type Narrowing (сужение типов)

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();   // здесь value: string
  }
  return value.toFixed(2);        // здесь value: number
}

// Проверка через in
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();  // ✅ TS понял что это Fish
  } else {
    animal.fly();   // ✅ это Bird
  }
}
```

### 1.9 Литеральные типы (Literal Types)

```typescript
type Direction = "up" | "down" | "left" | "right";

function move(dir: Direction) {
  // dir может быть только одним из 4 значений
}

move("up");        // ✅
// move("forward"); // ❌ Ошибка
```

### 1.10 Enum — перечисления

```typescript
enum Color {
  Red,      // 0
  Green,    // 1
  Blue      // 2
}
let c: Color = Color.Green;

// С явными значениями
enum Status {
  Active = "ACTIVE",
  Banned = "BANNED"
}

// Const enum — значения подставляются при компиляции
const enum Direction {
  Up = 1,
  Down = 2
}
let d = Direction.Up;  // компилируется в let d = 1;
```

**Вопрос:** чем обычный enum отличается от const enum?
- Обычный enum создаёт объект в рантайме
- Const enum полностью исчезает после компиляции, значения подставляются inline

---

## Уровень 2 — Middle (Уверенное владение)

### 2.1 Generics (обобщения)

Generics — это **параметризованные типы**, позволяющие создавать переиспользуемые компоненты.

```typescript
// Простая generic-функция
function identity<T>(arg: T): T {
  return arg;
}

identity<string>("hello");  // явное указание типа
identity(42);               // TS сам выведет T = number

// Generic-интерфейс
interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 42 };
const stringBox: Box<string> = { value: "текст" };

// Несколько параметров
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

const p = pair(1, "строка");  // тип: [number, string]
```

#### Ограничения generics (constraints)

```typescript
// T должен иметь поле length
function logLength<T extends { length: number }>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("строка");      // ✅ у string есть length
logLength([1, 2, 3]);     // ✅ у array есть length
// logLength(42);          // ❌ у number нет length

// Использование keyof
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Иван", age: 30 };
getProperty(user, "name");  // ✅ вернёт string
// getProperty(user, "foo"); // ❌ "foo" нет в user
```

### 2.2 Utility Types — встроенные утилиты

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// Partial — все поля опциональные
type PartialUser = Partial<User>;

// Required — все поля обязательные
type RequiredUser = Required<User>;

// Readonly — все поля только для чтения
type ReadonlyUser = Readonly<User>;

// Pick — выбрать только указанные поля
type UserBasic = Pick<User, "id" | "name">;

// Omit — исключить указанные поля
type UserWithoutEmail = Omit<User, "email">;

// Record — словарь с ключами и значениями
type UserRoles = Record<string, "admin" | "user">;

// Extract и Exclude — работа с union типами
type Status = "active" | "banned" | "pending";
type ActiveOrPending = Extract<Status, "active" | "pending">;  // "active" | "pending"
type NotBanned = Exclude<Status, "banned">;                     // "active" | "pending"

// NonNullable — убрать null и undefined
type DefinitelyString = NonNullable<string | null | undefined>;  // string

// ReturnType — тип возвращаемого значения функции
function createUser() {
  return { id: 1, name: "Иван" };
}
type UserReturn = ReturnType<typeof createUser>;

// Parameters — тип параметров функции
function greet(name: string, age: number) {}
type GreetParams = Parameters<typeof greet>;  // [string, number]
```

### 2.3 Mapped Types (отображаемые типы)

```typescript
// Сделать все поля опциональными
type Optional<T> = {
  [K in keyof T]?: T[K];
};

// Сделать все поля readonly
type Frozen<T> = {
  readonly [K in keyof T]: T[K];
};

// Изменить тип всех полей
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// Переименование ключей (с TS 4.1)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string; ... }
```

### 2.4 Conditional Types (условные типы)

```typescript
// Базовый синтаксис: T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// Практический пример — извлечение типа элемента массива
type ElementType<T> = T extends (infer U)[] ? U : T;

type E1 = ElementType<string[]>;  // string
type E2 = ElementType<number>;    // number
```

#### Распределённые условные типы (Distributive)

```typescript
type ToArray<T> = T[];
type A1 = ToArray<string | number>;  // (string | number)[]

// С условным типом — распределяется:
type ToArrayDistributive<T> = T extends any ? T[] : never;
type A2 = ToArrayDistributive<string | number>;  // string[] | number[]
```

#### `infer` — вывод типов внутри conditional

```typescript
// Извлечь тип промиса
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type P1 = UnwrapPromise<Promise<string>>;  // string
type P2 = UnwrapPromise<number>;           // number

// Извлечь тип возвращаемого значения
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
```

### 2.5 Type Guards (пользовательские стражи типов)

```typescript
interface Dog { bark(): void; }
interface Cat { meow(): void; }

// is-предикат
function isDog(pet: Dog | Cat): pet is Dog {
  return "bark" in pet;
}

function speak(pet: Dog | Cat) {
  if (isDog(pet)) {
    pet.bark();  // ✅ TS знает что это Dog
  } else {
    pet.meow();
  }
}

// Использование с unknown
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}
```

### 2.6 Discriminated Unions (размеченные объединения)

Очень мощный паттерн для моделирования состояний.

```typescript
type Result<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: Error }
  | { status: "loading" };

function handle<T>(result: Result<T>) {
  switch (result.status) {
    case "success":
      console.log(result.data);   // ✅ TS знает что есть data
      break;
    case "error":
      console.error(result.error); // ✅ TS знает что есть error
      break;
    case "loading":
      console.log("Загрузка...");
      break;
  }
}
```

### 2.7 Exhaustiveness Check (проверка полноты switch)

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      // Если добавили новый shape и забыли — будет ошибка
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

### 2.8 Declaration Merging и Module Augmentation

```typescript
// Расширение интерфейса из сторонней библиотеки
declare module "axios" {
  interface AxiosRequestConfig {
    customHeader?: string;
  }
}

// Расширение глобальных типов
declare global {
  interface Window {
    myCustomApi: {
      doSomething(): void;
    };
  }
}
```

### 2.9 Классы и модификаторы доступа

```typescript
class Animal {
  public name: string;         // доступно везде (по умолчанию)
  protected age: number;       // доступно в классе и наследниках
  private readonly id: number; // только в этом классе, нельзя менять

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
    this.id = Math.random();
  }
}

// Сокращённая запись через параметры
class User {
  constructor(
    public name: string,
    private age: number,
    readonly email: string
  ) {}
}
```

### 2.10 Индексные сигнатуры

```typescript
// Словарь с произвольными ключами
interface Dictionary {
  [key: string]: number;
}

const scores: Dictionary = {
  alice: 100,
  bob: 85
};

// Только для чтения
interface ReadonlyDict {
  readonly [key: string]: string;
}
```

---

## Уровень 3 — Senior (Продвинутые паттерны)

### 3.1 Template Literal Types (шаблонные литералы)

```typescript
type EventName = `on${Capitalize<string>}`;
const e1: EventName = "onClick";      // ✅
// const e2: EventName = "click";     // ❌

// Комбинация с union
type Color = "red" | "green" | "blue";
type CSSVar = `--color-${Color}`;     // "--color-red" | "--color-green" | ...

// Генерация событий для полей
type OnEvent<T extends string> = `on${Capitalize<T>}Change`;
type UserEvents = OnEvent<"name" | "email">;
// "onNameChange" | "onEmailChange"
```

### 3.2 Recursive Types (рекурсивные типы)

```typescript
// JSON-значение
type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

// Глубокий Partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Config {
  db: {
    host: string;
    port: number;
    credentials: { user: string; pass: string };
  };
}

type PartialConfig = DeepPartial<Config>;
const c: PartialConfig = {
  db: { host: "localhost" }  // ✅ все вложенные поля опциональны
};
```

### 3.3 Variance (вариативность)

Понимание **ковариантности**, **контравариантности** и **инвариантности** — признак senior-разработчика.

```typescript
class Animal { name: string = ""; }
class Dog extends Animal { bark() {} }

// Ковариантность (возвращаемые значения):
// () => Dog можно присвоить () => Animal ✅

// Контравариантность (параметры):
// (a: Animal) => void можно присвоить (d: Dog) => void ✅
// НО НЕ наоборот

// На практике с strictFunctionTypes:
let fnAnimal: (a: Animal) => void = (a) => console.log(a.name);
let fnDog: (d: Dog) => void = (d) => d.bark();

// fnAnimal = fnDog;  // ❌ опасно: fnAnimal может принять Cat, а fnDog вызовет bark
fnDog = fnAnimal;     // ✅ безопасно
```

### 3.4 Branded Types (номинативные типы)

TypeScript использует **структурную типизацию** — два типа с одинаковой формой считаются одинаковыми. Branded types позволяют этого избежать.

```typescript
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const userId = "user-123" as UserId;
const orderId = "order-456" as OrderId;

getUser(userId);   // ✅
// getUser(orderId); // ❌ компилятор поймает ошибку
```

**Почему это важно:** предотвращает ошибки вроде «передали ID заказа вместо ID пользователя» — типичная баг-фабрика в крупных системах.

### 3.5 Polymorphic `this`

```typescript
class Builder {
  protected value: string = "";

  add(part: string): this {
    this.value += part;
    return this;
  }
}

class AdvancedBuilder extends Builder {
  special() {
    this.value += "✨";
    return this;
  }
}

// Благодаря `this` цепочка работает корректно:
new AdvancedBuilder().add("a").special().add("b");
```

### 3.6 Продвинутые Utility Types — пишем свои

```typescript
// Сделать конкретные поля обязательными
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

interface Profile {
  id: number;
  name?: string;
  bio?: string;
}
type ProfileWithName = RequireKeys<Profile, "name">;

// Глубокий Readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Mutable (убрать readonly)
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// ValueOf — значения объекта как union
type ValueOf<T> = T[keyof T];

// PickByType — выбрать поля по типу значения
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

interface Example {
  id: number;
  name: string;
  age: number;
  active: boolean;
}
type StringFields = PickByType<Example, string>;  // { name: string }
type NumberFields = PickByType<Example, number>;  // { id: number; age: number }
```

### 3.7 Conditional Types с infer — сложные примеры

```typescript
// Извлечь первый элемент массива
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type H = Head<[string, number, boolean]>;  // string

// Извлечь «хвост»
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : [];
type T2 = Tail<[string, number, boolean]>;  // [number, boolean]

// Flatten массива
type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;
type F = Flatten<number[][][]>;  // number

// Перевернуть кортеж
type Reverse<T extends any[]> = T extends [infer H, ...infer R]
  ? [...Reverse<R>, H]
  : [];
type R = Reverse<[1, 2, 3]>;  // [3, 2, 1]
```

### 3.8 `satisfies` operator (TS 4.9+)

Проверяет соответствие типу, но **сохраняет более точный выведенный тип**:

```typescript
type Palette = Record<string, string | { r: number; g: number; b: number }>;

const palette = {
  // red: [255, 0, 0],       // ❌ Ошибка при проверке
  green: "#00ff00",
  blue: { r: 0, g: 0, b: 255 }
} satisfies Palette;

// Без satisfies: palette.green имеет тип string | {...}
// С satisfies: palette.green имеет точный тип string ✅
palette.green.toUpperCase();  // ✅ работает
```

### 3.9 Декораторы (TS 5.0+)

```typescript
function log(
  target: any,
  context: ClassMethodDecoratorContext
) {
  return function (this: any, ...args: any[]) {
    console.log(`Вызов ${String(context.name)}`);
    return target.apply(this, args);
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### 3.10 Type-level Programming (программирование на уровне типов)

Пример — проверка чётности на уровне типов:

```typescript
type BuildTuple<N extends number, T extends any[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, any]>;

type IsEven<N extends number> =
  BuildTuple<N> extends [any, any, ...infer R]
    ? R["length"] extends 0
      ? true
      : IsEven<R["length"]>
    : N extends 0 ? true : false;

type E1 = IsEven<0>;   // true
type E2 = IsEven<4>;   // true
type E3 = IsEven<3>;   // false
```

Это уже «тюремный TypeScript» — на собеседованиях встречается редко, но показывает глубину понимания.

---

## Типовые вопросы на собеседовании с ответами

### Q1: В чём разница между `interface` и `type`?
**Ответ:** Функционально пересекаются на 90%. `interface` поддерживает declaration merging, `type` — union, mapped types, conditional types. Конвенция: объекты → `interface`, всё остальное → `type`.

### Q2: Что такое `unknown` и чем отличается от `any`?
**Ответ:** `any` полностью отключает проверки. `unknown` требует type narrowing перед использованием — безопаснее.

### Q3: Что такое Generics и зачем нужны?
**Ответ:** Параметры для типов. Позволяют писать переиспользуемый код, сохраняя типобезопасность. Пример: `Array<T>`, `Promise<T>`.

### Q4: Что такое type narrowing?
**Ответ:** Процесс сужения union-типа до более конкретного с помощью `typeof`, `instanceof`, `in`, is-predicates, discriminated unions.

### Q5: Объясните `never` и когда он используется?
**Ответ:** Тип значения, которое никогда не возникает. Функции, бросающие исключения или имеющие бесконечный цикл. Используется в exhaustiveness checks.

### Q6: Что такое discriminated union?
**Ответ:** Union объектов с общим полем-дискриминатором (обычно литералом). Позволяет TS точно определить, с каким вариантом мы работаем в switch/if.

### Q7: Что такое `keyof` и `typeof`?
**Ответ:**
- `typeof x` — получить тип значения в type-позиции
- `keyof T` — получить union всех ключей типа T

```typescript
const user = { name: "Иван", age: 30 };
type User = typeof user;         // { name: string; age: number }
type UserKeys = keyof User;      // "name" | "age"
```

### Q8: Объясните structural vs nominal typing.
**Ответ:** TS использует **structural typing** — типы сравниваются по структуре, а не по имени. Если два класса имеют одинаковые поля, они совместимы. Branded types позволяют получить nominal behavior.

### Q9: Что такое Mapped Types?
**Ответ:** Типы, созданные путём итерации по ключам другого типа с помощью `[K in keyof T]`. Основа всех utility types.

### Q10: Что такое Variance?
**Ответ:** Правила совместимости обобщённых типов:
- Ковариантность: `Dog → Animal` ⇒ `Box<Dog> → Box<Animal>` (возвращаемые значения)
- Контравариантность: `Dog → Animal` ⇒ `(Animal) → void` ⇒ `(Dog) → void` (параметры функций)
- Инвариантность: нет совместимости (мутабельные поля)

### Q11: Зачем нужен `as const`?
**Ответ:** Превращает литералы в readonly literal types.

```typescript
const arr = [1, 2, 3];            // number[]
const arr2 = [1, 2, 3] as const;  // readonly [1, 2, 3]

const obj = { a: 1, b: "x" };           // { a: number; b: string }
const obj2 = { a: 1, b: "x" } as const; // { readonly a: 1; readonly b: "x" }
```

### Q12: Что такое Type Assertion и чем отличается от приведения?
**Ответ:** `as Type` или `<Type>value` — это подсказка компилятору, не меняющая рантайм-поведение. Не делает реальных преобразований, как `String(x)` в JS.

---

## Частые подводные камни (gotchas)

### 1. `==` vs `===` в type guards

```typescript
function check(x: unknown) {
  // if (x == null)  // ❌ TS не всегда понимает как narrowing
  if (x === null || x === undefined)  // ✅
}
```

### 2. Проблема с `.filter().map()`

```typescript
const arr: (string | null)[] = ["a", null, "b"];

// ❌ TS не понимает что после filter только string
const r1 = arr.filter(x => x !== null).map(x => x.toUpperCase());

// ✅ Решение 1: type predicate
const r2 = arr.filter((x): x is string => x !== null).map(x => x.toUpperCase());

// ✅ Решение 2: flatMap
const r3 = arr.flatMap(x => (x ? [x.toUpperCase()] : []));
```

### 3. `object` vs `Object` vs `{}`
- `object` — любой не-примитив (объект, массив, функция)
- `Object` — любой тип, у которого есть методы Object.prototype (почти всё)
- `{}` — любой тип, кроме `null` и `undefined`

**Практика:** почти всегда нужен `object` или конкретный интерфейс.

### 4. `Function` — плохой тип

```typescript
// ❌ Плохо
const fn: Function = () => {};

// ✅ Хорошо — точная сигнатура
const fn: () => void = () => {};
const fn2: (x: number) => string = (x) => x.toString();
```

### 5. Избыточные свойства (excess property checks)

```typescript
interface Point { x: number; y: number; }

// ❌ Ошибка: z — лишнее свойство
const p: Point = { x: 1, y: 2, z: 3 };

// ✅ ОК: через переменную проверка не срабатывает
const data = { x: 1, y: 2, z: 3 };
const p2: Point = data;  // работает
```

### 6. Опасность `!` (non-null assertion)

```typescript
const el = document.getElementById("root")!;  // мы уверены что есть
// Если элемента нет — будет runtime-ошибка, а TS об этом не скажет

// Безопаснее:
const el2 = document.getElementById("root");
if (!el2) throw new Error("Element not found");
```

### 7. Двойное сужение при async/await

```typescript
async function process(x: string | null) {
  if (x) {
    // здесь x: string
    await fetch("/api");
    x.toUpperCase();  // ❌ после await TS может забыть narrowing
  }
}

// Решение: сохранить в константу
async function process2(x: string | null) {
  if (x) {
    const value = x;
    await fetch("/api");
    value.toUpperCase();  // ✅
  }
}
```

---

## Настройка tsconfig — что важно знать

### Строгий режим — обязательно в продакшене

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Важные флаги, о которых спрашивают

| Флаг | Что делает |
|---|---|
| `strict` | Включает все строгие проверки |
| `strictNullChecks` | `null` и `undefined` не совместимы с другими типами |
| `noImplicitAny` | Запрещает неявный `any` |
| `noUncheckedIndexedAccess` | Добавляет `undefined` к индексным сигнатурам |
| `exactOptionalPropertyTypes` | Различает отсутствие поля и `undefined` |
| `isolatedModules` | Каждый файл компилируется независимо (нужно для esbuild/Vite) |
| `verbatimModuleSyntax` | Чёткое разделение type- и value-импортов |

### Правильный импорт типов

```typescript
// ✅ Type-only импорт — исчезает после компиляции
import type { User } from "./types";

// Обычный импорт
import { createUser } from "./factory";
```

---

## Чек-лист перед собеседованием

### Junior
- [ ] Знаю все примитивы
- [ ] Понимаю `any` vs `unknown` vs `never` vs `void`
- [ ] Могу объяснить разницу `interface` vs `type`
- [ ] Понимаю union, intersection, literal types
- [ ] Умею сужать типы через `typeof`, `in`, `instanceof`
- [ ] Знаю базовый синтаксис функций и generics
- [ ] Понимаю enum и кортежи

### Middle
- [ ] Уверенно пишу generic-функции с constraints
- [ ] Знаю все основные utility types (Partial, Pick, Omit, Record, ReturnType...)
- [ ] Понимаю mapped и conditional types
- [ ] Умею писать type guards через `is`
- [ ] Использую discriminated unions для состояний
- [ ] Знаю exhaustiveness check через `never`
- [ ] Понимаю `keyof`, `typeof`, indexed access (`T[K]`)
- [ ] Разбираюсь в классах и модификаторах доступа

### Senior
- [ ] Могу писать сложные utility types с `infer`
- [ ] Понимаю variadic tuple types
- [ ] Знаю template literal types
- [ ] Понимаю variance (ковариантность, контравариантность)
- [ ] Использую branded types
- [ ] Знаю `satisfies`, `as const`
- [ ] Умею писать type-level программы (рекурсия, условные)
- [ ] Понимаю тонкости tsconfig и module resolution
- [ ] Знаю про declaration merging и module augmentation
- [ ] Понимаю ограничения и подводные камни TS

---

## 🎯 Финальные советы

1. **Не зубрите** — понимайте принципы. На собеседовании важнее ход мыслей.
2. **Практика > теория.** Напишите руками все utility types — запомнится навсегда.
3. **Читайте ошибки компилятора** — они часто содержат готовые решения.
4. **На собеседовании думайте вслух.** Интервьюер смотрит на процесс, а не только на ответ.
5. **Если не знаете — скажите, как бы решали.** Это ценится больше, чем молчание.

---

> **Автор заметки:** этот гайд покрывает ~95% тем, которые встречаются на собеседованиях по TypeScript. Остальные 5% — это специфика конкретных проектов и библиотек.

Удачи на собеседовании! 🚀
