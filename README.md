# 🚀 Visiology Widget Simulator

> 🤖 **AI-powered инструмент** для автоматизированной разработки кастомных виджетов платформы **Visiology** с помощью ИИ-агентов в **Cursor IDE**

---

## 📋 Оглавление

- [🌟 О проекте](#-о-проекте)
- [🏗️ Архитектура](#️-архитектура)
- [⚡ Быстрый старт](#-быстрый-старт)
- [🤖 Работа с ИИ-агентом](#-работа-с-ии-агентом)
- [📂 Структура виджета](#-структура-виджета)
- [🔌 HTTP API](#-http-api)
- [📊 Структура данных](#-структура-данных)
- [🎨 Шаблоны виджетов](#-шаблоны-виджетов)
- [💡 Советы и лайфхаки](#-советы-и-лайфхаки)
- [🐛 Отладка](#-отладка)
- [📦 Технологический стек](#-технологический-стек)
- [👥 Команда](#-команда)

---

## 🌟 О проекте

**Visiology Widget Simulator** — это локальная среда разработки, которая позволяет создавать, тестировать и отлаживать кастомные JavaScript-виджеты для BI-платформы **Visiology** 📊

Ключевая особенность — **полная интеграция с Cursor IDE**: ИИ-агент самостоятельно пишет код виджета, загружает его в симулятор, визуально проверяет результат через встроенный браузер и итеративно дорабатывает до готового состояния 🎯

```mermaid
mindmap
  root((🎯 Visiology<br/>Widget Simulator))
    🤖 ИИ-автоматизация
      Cursor IDE интеграция
      Автосоздание виджетов
      Визуальная проверка
      Итеративная доработка
    📊 Визуализация
      Apache ECharts
      Highcharts
      Кастомный HTML/CSS
      Адаптивные графики
    🔧 Инструменты
      Редактор кода
      CSV-загрузка данных
      Привязка DataRoles
      Импорт/Экспорт
    🌐 API
      HTTP REST API
      Polling-команды
      Логирование ошибок
      Список виджетов
```

---

## 🏗️ Архитектура

### 🔄 Общая схема работы

```mermaid
graph TB
    subgraph "🖥️ Cursor IDE"
        A[🤖 ИИ-агент<br/>Claude / GPT / Gemini] --> B[📝 Создаёт файлы виджета]
        B --> C[📤 Загружает через HTTP API]
        C --> D[👁️ Проверяет в Browser Tab]
        D --> E{✅ Результат OK?}
        E -->|❌ Нет| A
        E -->|✅ Да| F[🎉 Виджет готов!]
    end

    subgraph "🌐 Симулятор localhost:3000"
        G[⚙️ Vite Dev Server] --> H[🖼️ React Frontend]
        G --> I[🔌 API Middleware]
        H --> J[📊 WidgetPreview<br/>Песочница выполнения]
        I --> K[(📁 widgets/)]
    end

    C -->|curl /api/load| I
    D -->|browser_snapshot| H
    I -->|Читает файлы| K
    K -->|widget.json + code.js<br/>+ data.csv + bindings.json| I

    style A fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style F fill:#00B894,stroke:#00A381,color:#fff
    style G fill:#0984E3,stroke:#0873C7,color:#fff
    style J fill:#FDCB6E,stroke:#E0B54E,color:#333
```

### 🧩 Компонентная архитектура фронтенда

```mermaid
graph LR
    subgraph "🖼️ React App"
        APP[📱 App.jsx<br/>Главный компонент] --> HEADER[🔝 Header]
        APP --> DATA[📋 DataPanel<br/>CSV загрузка]
        APP --> ROLES[🔗 DataRolesPanel<br/>Привязка полей]
        APP --> CODE[💻 CodeEditor<br/>Редактор кода]
        APP --> PREVIEW[📊 WidgetPreview<br/>Превью виджета]
        APP --> PROPS[⚙️ PropertiesPanel<br/>Свойства]
        APP --> MODAL[📦 ImportExportModal]
        APP --> TOAST[💬 Toast уведомления]
        APP --> API_INPUT[🔌 ApiCommandInput<br/>API терминал]
    end

    PREVIEW --> ECHARTS[📈 ECharts]
    PREVIEW --> HIGHCHARTS[📊 Highcharts]
    PREVIEW --> VISAPI[🔮 visApi мок]

    style APP fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style PREVIEW fill:#FDCB6E,stroke:#E0B54E,color:#333
    style ECHARTS fill:#E17055,stroke:#C45A42,color:#fff
    style HIGHCHARTS fill:#00B894,stroke:#00A381,color:#fff
```

### 🔄 Жизненный цикл загрузки виджета

```mermaid
sequenceDiagram
    participant 🤖 as ИИ-агент
    participant 🔌 as API Server
    participant 📁 as Файловая система
    participant 🌐 as Browser (React)
    participant 📊 as WidgetPreview

    🤖->>📁: 1. Создаёт widget.json, code.js,<br/>data.csv, bindings.json
    🤖->>🔌: 2. curl /api/load?name=my-widget
    🔌->>📁: 3. Читает файлы виджета
    📁-->>🔌: 4. Возвращает содержимое
    🔌->>🔌: 5. Формирует команду загрузки
    🌐->>🔌: 6. Polling: GET /api/command
    🔌-->>🌐: 7. Команда: loadAll(widget, csv, bindings)
    🌐->>🌐: 8. Парсинг CSV (PapaParse)
    🌐->>🌐: 9. Привязка DataRoles
    🌐->>📊: 10. Рендер виджета
    📊->>📊: 11. Выполнение code.js в песочнице
    📊-->>🌐: 12. Визуализация готова ✨
    🤖->>🌐: 13. browser_snapshot → проверка
    🤖->>🔌: 14. curl /api/errors → проверка ошибок
```

---

## ⚡ Быстрый старт

### 📋 Предварительные требования

| Инструмент | Версия | Описание |
|:---:|:---:|:---|
| 🟢 **Node.js** | 18+ | JavaScript runtime |
| 📦 **npm** | 9+ | Пакетный менеджер |
| 🖥️ **Cursor IDE** | Последняя | IDE с ИИ-агентами |

### 🔧 Шаг 1: Клонирование проекта

```bash
git clone <repository-url> visio-simulator
cd visio-simulator
```

### 📦 Шаг 2: Установка зависимостей

Откройте проект в **Cursor IDE** и выполните в терминале:

```bash
npm install
```

### 🚀 Шаг 3: Запуск симулятора

```bash
npm run dev
```

> ✅ Симулятор запустится на **http://localhost:3000**

### 🌐 Шаг 4: Открытие Browser Tab в Cursor

1. Откройте **Browser Tab** в Cursor IDE (встроенный браузер) 🖥️
2. Перейдите на **http://localhost:3000** 🌐
3. Убедитесь, что симулятор загрузился и отображает интерфейс ✅

```mermaid
graph LR
    A[📂 Клонировать проект] --> B[📦 npm install]
    B --> C[🚀 npm run dev]
    C --> D[🌐 Открыть Browser Tab]
    D --> E[🤖 Запустить ИИ-агента]
    E --> F[✨ Виджет готов!]

    style A fill:#74B9FF,stroke:#5A9FE5,color:#333
    style B fill:#81ECEC,stroke:#67D2D2,color:#333
    style C fill:#55EFC4,stroke:#3BD5AA,color:#333
    style D fill:#FFEAA7,stroke:#E5D08D,color:#333
    style E fill:#DFE6E9,stroke:#C5CCD0,color:#333
    style F fill:#00B894,stroke:#00A381,color:#fff
```

---

## 🤖 Работа с ИИ-агентом

### 🧠 Выбор модели

Для работы с симулятором рекомендуется следующая стратегия выбора ИИ-модели:

```mermaid
graph TD
    START[🎯 Задача] --> Q1{Создание виджета<br/>с нуля?}

    Q1 -->|✅ Да| OPUS[🧠 Claude 4.6 Opus<br/>Максимальное качество<br/>Лучший результат с первого раза]

    Q1 -->|❌ Нет| Q2{Исправление /<br/>доработка?}

    Q2 -->|✅ Да| SONNET[⚡ Claude 4.5 Sonnet<br/>или GPT-5.2<br/>Баланс цена/качество]

    Q2 -->|❌ Нет| Q3{Мелкие правки /<br/>стиль?}

    Q3 -->|✅ Да| FAST[💨 Gemini 3 Flash<br/>или GPT-5 Mini<br/>Максимальная экономия]

    OPUS --> RESULT[🎉 Виджет готов!]
    SONNET --> RESULT
    FAST --> RESULT

    style OPUS fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style SONNET fill:#0984E3,stroke:#0873C7,color:#fff
    style FAST fill:#00B894,stroke:#00A381,color:#fff
    style RESULT fill:#FDCB6E,stroke:#E0B54E,color:#333
```

| Сценарий | Рекомендуемая модель | Стоимость | Качество |
|:---|:---|:---:|:---:|
| 🆕 Создание виджета с нуля | **Claude 4.6 Opus** | 💰💰💰 | ⭐⭐⭐⭐⭐ |
| 🔧 Доработка / исправление | **Claude 4.5 Sonnet** / **GPT-5.2** | 💰💰 | ⭐⭐⭐⭐ |
| ✏️ Мелкие правки, стили | **Gemini 3 Flash** / **GPT-5 Mini** | 💰 | ⭐⭐⭐ |

> 💡 **Совет:** Используйте **Opus 4.6** для создания виджета с нуля — он выдаёт наиболее качественный результат с первой попытки. Для последующих корректировок и доработок переключитесь на более экономичные модели.
>
> 💲 Актуальные цены на модели: **[cursor.com/docs/models — Model pricing](https://cursor.com/docs/models#model-pricing)**

### 📝 Пошаговая инструкция

#### 1️⃣ Подготовка промпта

Скопируйте или переместите файл `CURSOR_PROMPT.md` (системный промпт для ИИ-агента) в качестве контекста для агента.

#### 2️⃣ Формирование задачи

Напишите или вставьте **техническое задание** (ТЗ) на виджет в чат агента. Обязательно укажите:

```
📌 Симулятор уже запущен на http://localhost:3000 и открыт в Browser Tab.
📌 Создай виджет [название] по следующему ТЗ: ...
```

#### 3️⃣ Автоматическая работа агента

После получения задачи ИИ-агент **самостоятельно**:

```mermaid
graph TD
    A[📝 Получает ТЗ] --> B[🧠 Анализирует требования]
    B --> C[📁 Создаёт файлы виджета]
    C --> C1[widget.json — метаданные]
    C --> C2[code.js — JavaScript код]
    C --> C3[data.csv — тестовые данные]
    C --> C4[bindings.json — привязки полей]
    C1 & C2 & C3 & C4 --> D[📤 Загружает в симулятор<br/>curl /api/load]
    D --> E[👁️ Проверяет визуально<br/>browser_snapshot]
    E --> F{✅ Всё OK?}
    F -->|❌ Нет| G[🔧 Исправляет ошибки]
    G --> D
    F -->|✅ Да| H[🎉 Виджет готов!]

    style A fill:#74B9FF,stroke:#5A9FE5,color:#333
    style H fill:#00B894,stroke:#00A381,color:#fff
    style F fill:#FDCB6E,stroke:#E0B54E,color:#333
```

1. 📁 **Создаёт** папку виджета в `widgets/`
2. ✍️ **Пишет** код виджета (`code.js`)
3. 📊 **Генерирует** тестовые данные (`data.csv`)
4. 🔗 **Настраивает** привязки полей (`bindings.json`)
5. 📤 **Загружает** виджет через API симулятора
6. 👁️ **Проверяет** результат визуально через Browser Tab
7. 🐛 **Анализирует** ошибки, если есть
8. 🔄 **Итеративно дорабатывает** до идеального результата

---

## 📂 Структура виджета

Каждый виджет — это папка в директории `widgets/` со следующей структурой:

```mermaid
graph TD
    WIDGETS[📁 widgets/] --> WIDGET[📂 my-custom-chart/]
    WIDGET --> WJ[📄 widget.json<br/>Метаданные виджета]
    WIDGET --> CJ[📝 code.js<br/>JavaScript код]
    WIDGET --> DC[📊 data.csv<br/>Тестовые данные]
    WIDGET --> BJ[🔗 bindings.json<br/>Привязки полей]

    style WIDGETS fill:#636E72,stroke:#535E62,color:#fff
    style WIDGET fill:#0984E3,stroke:#0873C7,color:#fff
    style WJ fill:#FDCB6E,stroke:#E0B54E,color:#333
    style CJ fill:#55EFC4,stroke:#3BD5AA,color:#333
    style DC fill:#74B9FF,stroke:#5A9FE5,color:#333
    style BJ fill:#DFE6E9,stroke:#C5CCD0,color:#333
```

### 📄 widget.json — Метаданные

```json
{
  "Name": "My Custom Chart",
  "DataRoles": [
    {
      "Name": "category",
      "DisplayName": "Категория",
      "Description": "Поля группировки",
      "Kind": 0,
      "Optional": false
    },
    {
      "Name": "value",
      "DisplayName": "Значение",
      "Description": "Числовые поля",
      "Kind": 1,
      "Optional": false
    }
  ],
  "Properties": [
    {
      "DisplayName": "Цвет",
      "PropertyName": "color",
      "Value": "#00b4d8",
      "Type": 3
    }
  ]
}
```

### ⚠️ Только 2 роли данных (DataRoles)

```mermaid
graph LR
    CSV[📊 CSV данные] --> CAT[🏷️ Категория<br/>Kind: 0<br/>Строковые поля]
    CSV --> VAL[🔢 Значение<br/>Kind: 1<br/>Числовые поля]

    CAT --> EX1[Название]
    CAT --> EX2[Регион]
    CAT --> EX3[Дата]

    VAL --> EX4[Сумма]
    VAL --> EX5[Количество]
    VAL --> EX6[Процент]

    style CAT fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style VAL fill:#E17055,stroke:#C45A42,color:#fff
```

| Роль | Kind | Тип данных | Примеры полей |
|:---:|:---:|:---:|:---|
| 🏷️ **Категория** (Dimension) | `0` | Строки | Category, Segment, Name, Region |
| 🔢 **Значение** (Measure) | `1` | Числа | Value, Amount, Target, Percent |

### 📝 code.js — JavaScript код виджета

> ⚠️ **Важно:** код пишется в отдельном файле `code.js`, а **не** внутри `widget.json`!

```javascript
(function() {
  var container = document.getElementById(w.general.renderTo);
  var props = w.props || {};
  var items = w.data?.primaryData?.items || [];

  if (!items.length) {
    container.innerHTML = '<div style="color:#999;text-align:center;">Нет данных</div>';
    return;
  }

  // ... логика виджета ...

  var chart = echarts.init(container);
  chart.setOption({ /* опции */ });

  new ResizeObserver(() => chart.resize()).observe(container);
})();
```

### 📊 data.csv — Тестовые данные

```csv
Category,Segment,Value,Target
Продукт A,Высокий,100,120
Продукт A,Низкий,80,90
Продукт B,Высокий,150,140
```

### 🔗 bindings.json — Привязки полей

```json
{
  "category": ["Category", "Segment"],
  "value": ["Value", "Target"]
}
```

- `category` — массив строковых колонок CSV → Роль "Категория" 🏷️
- `value` — массив числовых колонок CSV → Роль "Значение" 🔢

---

## 🔌 HTTP API

Симулятор предоставляет REST API для программного управления:

```mermaid
graph LR
    subgraph "🔌 API Endpoints"
        A[GET /api/status] -.-> A1[📡 Статус симулятора]
        B[GET /api/load?name=...] -.-> B1[📥 Загрузка виджета]
        C[POST /api/load-direct] -.-> C1[📤 Прямая загрузка JSON]
        D[GET /api/errors] -.-> D1[🐛 Ошибки выполнения]
        E[GET /api/logs] -.-> E1[📋 Логи]
        F[GET /api/widgets] -.-> F1[📂 Список виджетов]
        G[GET /api/command] -.-> G1[⏳ Polling команд]
    end

    style A fill:#55EFC4,stroke:#3BD5AA,color:#333
    style B fill:#74B9FF,stroke:#5A9FE5,color:#333
    style C fill:#A29BFE,stroke:#8882E4,color:#333
    style D fill:#E17055,stroke:#C45A42,color:#fff
    style E fill:#FDCB6E,stroke:#E0B54E,color:#333
    style F fill:#DFE6E9,stroke:#C5CCD0,color:#333
    style G fill:#636E72,stroke:#535E62,color:#fff
```

| Endpoint | Метод | Описание | Пример |
|:---|:---:|:---|:---|
| `/api/status` | 🟢 GET | Статус симулятора | `curl http://localhost:3000/api/status` |
| `/api/load?name=widget` | 🟢 GET | Загрузить виджет из `widgets/` | `curl "http://localhost:3000/api/load?name=my-chart"` |
| `/api/load-direct` | 🟡 POST | Загрузить виджет из JSON-тела | `curl -X POST -d '...' http://localhost:3000/api/load-direct` |
| `/api/errors` | 🟢 GET | Получить ошибки выполнения | `curl http://localhost:3000/api/errors` |
| `/api/logs` | 🟢 GET | Получить логи | `curl http://localhost:3000/api/logs` |
| `/api/widgets` | 🟢 GET | Список всех доступных виджетов | `curl http://localhost:3000/api/widgets` |
| `/api/command` | 🟢 GET | Polling ожидающих команд | Используется браузером |

---

## 📊 Структура данных

### 🗂️ Объект `w` — контекст виджета

```mermaid
graph TD
    W[🗂️ w] --> GENERAL[📐 w.general]
    W --> DATA[📊 w.data]
    W --> PROPS[⚙️ w.props]
    W --> COLORS[🎨 w.colors]

    GENERAL --> R[renderTo — ID контейнера]
    GENERAL --> WIDTH[width — Ширина]
    GENERAL --> HEIGHT[height — Высота]

    DATA --> PD[primaryData]
    PD --> ITEMS[items — Массив данных]

    ITEMS --> ITEM[📦 item]
    ITEM --> KEYS[keys — Значения категорий]
    ITEM --> VALS[values — Числовые значения]
    ITEM --> COLS[cols — Все названия колонок]

    style W fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style GENERAL fill:#0984E3,stroke:#0873C7,color:#fff
    style DATA fill:#00B894,stroke:#00A381,color:#fff
    style PROPS fill:#FDCB6E,stroke:#E0B54E,color:#333
    style COLORS fill:#E17055,stroke:#C45A42,color:#fff
```

```javascript
// 📐 Общие параметры
w.general.renderTo      // ID контейнера для рендера
w.general.width         // Ширина виджета
w.general.height        // Высота виджета

// 📊 Данные
w.data.primaryData.items  // Массив данных

// ⚙️ Свойства
w.props                 // Пользовательские свойства виджета

// 🎨 Палитра
w.colors                // Массив цветов
```

### 📦 Структура элемента данных (item)

```javascript
{
  keys: ["Продукт A", "Высокий"],        // 🏷️ Значения категорий
  values: [100, 120],                     // 🔢 Числовые значения
  cols: ["Category", "Segment", "Value", "Target"],  // 📋 Все колонки
  formattedKeys: ["Продукт A", "Высокий"],  // 🏷️ Форматированные категории
  formattedValues: ["100", "120"]            // 🔢 Форматированные значения
}
```

### 📚 Доступные библиотеки

| Библиотека | Глобальная переменная | Описание |
|:---|:---|:---|
| 📈 Apache ECharts | `echarts` | Библиотека визуализации |
| 📊 Highcharts | `Highcharts` | Библиотека графиков |
| 🔧 Lodash | `lodash` / `_` | Утилиты |
| 🔮 Visiology API | `visApi()` | Эмуляция API платформы |

---

## 🎨 Шаблоны виджетов

### 📈 Базовый шаблон ECharts

```javascript
(function() {
  var container = document.getElementById(w.general.renderTo);
  var props = w.props || {};
  var items = w.data?.primaryData?.items || [];

  if (!items.length) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">📊 Нет данных</div>';
    return;
  }

  var existingChart = echarts.getInstanceByDom(container);
  if (existingChart) existingChart.dispose();

  var categories = items.map(function(item) { return item.keys[0]; });
  var values = items.map(function(item) { return item.values[0]; });

  var chart = echarts.init(container);
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: props.color || '#00b4d8' }
    }]
  });

  new ResizeObserver(function() { chart.resize(); }).observe(container);
})();
```

### 🥧 Шаблон круговой диаграммы

```javascript
(function() {
  var container = document.getElementById(w.general.renderTo);
  var items = w.data?.primaryData?.items || [];

  if (!items.length) {
    container.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">🥧 Нет данных</div>';
    return;
  }

  var existing = echarts.getInstanceByDom(container);
  if (existing) existing.dispose();

  var data = items.map(function(item, i) {
    return {
      name: item.keys[0],
      value: item.values[0],
      itemStyle: { color: w.colors[i % w.colors.length] }
    };
  });

  var chart = echarts.init(container);
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: '#9aa0a6' } },
    series: [{ type: 'pie', radius: '60%', data: data }]
  });

  new ResizeObserver(function() { chart.resize(); }).observe(container);
})();
```

---

## 💡 Советы и лайфхаки

### 🎯 Стратегия использования моделей

```mermaid
graph LR
    subgraph "💰 Экономная стратегия"
        direction TB
        S1[🧠 Opus 4.6<br/>Создание с нуля] --> S2[⚡ Sonnet 4.5<br/>Корректировки] --> S3[💨 Flash / Mini<br/>Мелкие правки]
    end

    style S1 fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style S2 fill:#0984E3,stroke:#0873C7,color:#fff
    style S3 fill:#00B894,stroke:#00A381,color:#fff
```

> 🧠 **Opus 4.6** → для создания виджета с нуля (лучшее качество)
>
> ⚡ **Sonnet 4.5 / GPT-5.2** → для исправлений и доработок
>
> 💨 **Flash / Mini** → для косметических правок

### 🚀 Параллельное создание виджетов

Если нужно создать **много виджетов**, можно попросить ИИ-агента использовать **параллельные субагенты**:

```mermaid
graph TD
    MAIN[🤖 Главный агент] --> SUB1[🔧 Субагент 1<br/>Виджет A]
    MAIN --> SUB2[🔧 Субагент 2<br/>Виджет B]
    MAIN --> SUB3[🔧 Субагент 3<br/>Виджет C]
    MAIN --> SUB4[🔧 Субагент 4<br/>Виджет D]

    SUB1 --> FILES1[📁 Создаёт файлы]
    SUB2 --> FILES2[📁 Создаёт файлы]
    SUB3 --> FILES3[📁 Создаёт файлы]
    SUB4 --> FILES4[📁 Создаёт файлы]

    FILES1 & FILES2 & FILES3 & FILES4 --> CHECK[🤖 Главный агент<br/>Проверяет последовательно<br/>каждый виджет в симуляторе]

    CHECK --> DONE[✅ Все виджеты готовы!]

    style MAIN fill:#6C5CE7,stroke:#5A4BD1,color:#fff
    style CHECK fill:#FDCB6E,stroke:#E0B54E,color:#333
    style DONE fill:#00B894,stroke:#00A381,color:#fff
```

> 💡 **Tip:** Попросите агента создать виджеты параллельно через субагенты, но **без проверки в симуляторе** каждым субагентом. После создания всех файлов — проверьте каждый виджет **последовательно** в симуляторе. Это значительно ускоряет процесс! 🏎️

### 📝 Чеклист для создания виджета

```
✅ Создать папку widgets/название-виджета/
✅ Создать widget.json с метаданными (DataRoles, Properties)
✅ Создать code.js с JavaScript-кодом виджета
✅ Создать data.csv с тестовыми данными
✅ Создать bindings.json с привязками полей
✅ curl "http://localhost:3000/api/load?name=название-виджета"
✅ Проверить результат в Browser Tab
✅ curl "http://localhost:3000/api/errors" → проверить ошибки
✅ Исправить ошибки (если есть) и повторить
```

### ⚠️ Важные правила при написании кода виджета

1. 🛡️ **Всегда проверяй наличие данных:**
   ```javascript
   if (!w.data?.primaryData?.items?.length) { return; }
   ```

2. 🧹 **Очищай предыдущий chart:**
   ```javascript
   var existing = echarts.getInstanceByDom(container);
   if (existing) existing.dispose();
   ```

3. 📦 **Оборачивай код в IIFE:**
   ```javascript
   (function() { /* ... */ })();
   ```

4. 📐 **Добавляй ResizeObserver для адаптивности:**
   ```javascript
   new ResizeObserver(() => chart.resize()).observe(container);
   ```

---

## 🐛 Отладка

| Проблема | Причина | Решение |
|:---|:---|:---|
| 📭 "Нет данных" | Неверные привязки | Проверьте `bindings.json` и `data.csv` |
| 🖼️ График не появляется | Размеры контейнера = 0 | Добавьте `setTimeout`, проверьте `renderTo` |
| ❌ Ошибка в коде | Синтаксис / логика | `curl http://localhost:3000/api/errors` |
| 📂 Виджет не загружается | Нет файлов | `curl http://localhost:3000/api/widgets` |
| 🔄 Не обновляется | Кеш команд | Перезагрузите страницу симулятора |

```mermaid
graph TD
    ERR[🐛 Обнаружена проблема] --> CHECK1{Виджет загрузился?}

    CHECK1 -->|❌ Нет| FIX1[📂 Проверить структуру файлов<br/>и названия папки]
    CHECK1 -->|✅ Да| CHECK2{Данные отображаются?}

    CHECK2 -->|❌ Нет| FIX2[🔗 Проверить bindings.json<br/>и data.csv]
    CHECK2 -->|✅ Да| CHECK3{Есть ошибки?}

    CHECK3 -->|✅ Да| FIX3[🐛 curl /api/errors<br/>Исправить код]
    CHECK3 -->|❌ Нет| CHECK4{Отображение OK?}

    CHECK4 -->|❌ Нет| FIX4[🎨 Проверить CSS стили<br/>и размеры контейнера]
    CHECK4 -->|✅ Да| DONE[✅ Виджет работает!]

    FIX1 --> ERR
    FIX2 --> ERR
    FIX3 --> ERR
    FIX4 --> ERR

    style ERR fill:#E17055,stroke:#C45A42,color:#fff
    style DONE fill:#00B894,stroke:#00A381,color:#fff
```

---

## 📦 Технологический стек

```mermaid
graph TB
    subgraph "🖥️ Frontend"
        REACT[⚛️ React 18]
        VITE[⚡ Vite 4]
        TW[🎨 Tailwind CSS 3]
        TS[📘 TypeScript]
    end

    subgraph "📊 Визуализация"
        EC[📈 Apache ECharts 5]
        HC[📊 Highcharts 11]
    end

    subgraph "🔧 Утилиты"
        LO[🔧 Lodash]
        PP[📋 PapaParse]
        LR[🎯 Lucide React]
    end

    subgraph "🔌 Backend"
        VM[⚙️ Vite Middleware<br/>API Server]
        FS[📁 File System<br/>widgets/]
    end

    REACT --> EC
    REACT --> HC
    VITE --> VM
    PP --> VM

    style REACT fill:#61DAFB,stroke:#47C0E1,color:#333
    style VITE fill:#646CFF,stroke:#4A52E5,color:#fff
    style TW fill:#06B6D4,stroke:#009BBB,color:#fff
    style EC fill:#AA344D,stroke:#903040,color:#fff
    style HC fill:#8085E9,stroke:#666BCF,color:#fff
```

| Категория | Технология | Версия |
|:---|:---|:---:|
| ⚛️ UI Framework | React | 18.2 |
| ⚡ Build Tool | Vite | 4.4 |
| 🎨 Стили | Tailwind CSS | 3.3 |
| 📈 Графики | Apache ECharts | 5.4 |
| 📊 Графики | Highcharts | 11.4 |
| 🔧 Утилиты | Lodash | 4.17 |
| 📋 CSV парсинг | PapaParse | 5.4 |

---

## 🔮 Эмуляция Visiology API

Симулятор предоставляет мок `visApi()` с поддержкой:

| Метод | Описание |
|:---|:---|
| 🔍 `getSelectedValues()` | Получить выбранные значения фильтров |
| 🎛️ `setFilterSelectedValues()` | Установить фильтры |
| 📊 `drillDown()` / `drillUp()` | Drill-down навигация |
| 📢 `onSelectedValuesChangedListener()` | Подписка на изменения |
| 📤 `exportDashboard()` | Экспорт дашборда |
| 🌍 `getLocale()` | Получить локаль |
| 🎨 `getTheme()` | Получить тему |

---

## 🌟 Важный момент

> 🧪 **Всё приходит с опытом** — пробуйте, экспериментируйте, адаптируйте и обязательно **улучшите и ускорите процесс под себя!**
>
> Каждая команда и проект уникальны. Не бойтесь менять подходы, комбинировать модели, настраивать промпты и искать свой идеальный workflow. Результаты будут улучшаться с каждой итерацией! 🚀

---

## 📜 Скрипты

```bash
# 🚀 Запуск dev-сервера (http://localhost:3000)
npm run dev

# 📦 Сборка для продакшена
npm run build

# 👁️ Превью собранного билда
npm run preview
```

---

## 👥 Команда

<div align="center">

### 🏢 Сделано командой FatData по заказу Visiology

### 👨‍💼 Руководитель проекта: Чжен Артём

</div>

---

<div align="center">

🤖 **Visiology Widget Simulator** — Автоматизация разработки виджетов с помощью ИИ

⭐ Если проект полезен — поставьте звезду!

</div>
