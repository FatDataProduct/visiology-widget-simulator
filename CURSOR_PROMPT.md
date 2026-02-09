# Visiology Widget Development - Cursor IDE Guide

## Обзор

Ты — эксперт по разработке кастомных JavaScript-виджетов для BI-платформы Visiology.

**Симулятор:** http://localhost:3000

---

## 🚀 БЫСТРЫЙ СТАРТ (WORKFLOW)

### Шаг 1: Создай папку виджета

Создай папку в `widgets/` с названием виджета (slug формат):

```
widgets/
  my-custom-chart/
    widget.json    ← код виджета
    data.csv       ← тестовые данные
    bindings.json  ← привязки полей к ролям
```

### Шаг 2: Создай файлы

**widget.json** — виджет в формате Visiology:
```json
{
  "Name": "My Custom Chart",
  "Code": "(function() { ... })();",
  "DataRoles": [
    { "Name": "dim", "DisplayName": "Категория", "Kind": 0 },
    { "Name": "msr", "DisplayName": "Значение", "Kind": 1 }
  ],
  "Properties": [
    { "DisplayName": "Цвет", "PropertyName": "color", "Value": "#00b4d8", "Type": 3 }
  ]
}
```

**data.csv** — тестовые данные:
```csv
Category,Segment,Value,Target
A,High,100,120
A,Low,80,90
B,High,150,140
```

**bindings.json** — какие колонки CSV привязать к каким ролям:
```json
{
  "category": ["Category"],
  "value": ["Value", "Target"]
}
```

### Шаг 3: Загрузи виджет через API

```bash
curl "http://localhost:3000/api/load?name=my-custom-chart"
```

Или через терминал в Cursor:
```
run_terminal_cmd: curl "http://localhost:3000/api/load?name=my-custom-chart"
```

### Шаг 4: Проверь результат в браузере

Используй встроенный browser MCP:
1. `browser_navigate` → http://localhost:3000
2. `browser_snapshot` или `browser_take_screenshot` → посмотреть результат

### Шаг 5: Проверь ошибки

```bash
curl "http://localhost:3000/api/errors"
```

---

## 📁 СТРУКТУРА ПАПКИ ВИДЖЕТА

```
widgets/
  название-виджета/           ← slug: lowercase, дефисы вместо пробелов
    widget.json               ← ОБЯЗАТЕЛЬНО: метаданные (Name, DataRoles, Properties)
    code.js                   ← ОБЯЗАТЕЛЬНО: JavaScript код виджета (отдельный файл!)
    data.csv                  ← ОБЯЗАТЕЛЬНО: тестовые данные
    bindings.json             ← ОБЯЗАТЕЛЬНО: привязки полей
```

### ⚠️ ВАЖНО: КОД В ОТДЕЛЬНОМ ФАЙЛЕ!

**НЕ пиши код в widget.json!** Используй отдельный файл `code.js`:
- Удобно редактировать (нормальное форматирование)
- Симулятор сам читает code.js при загрузке
- При экспорте код автоматически конвертируется в формат Visiology

---

## ⚠️ ВАЖНО: ТОЛЬКО 2 РОЛИ ДАННЫХ!

Симулятор поддерживает **ровно 2 роли** (как в Visiology):

| Роль | Kind | Описание | Пример полей |
|------|------|----------|--------------|
| **Категория** (Dimension) | `0` | Строковые значения для группировки | Category, Segment, Name |
| **Значение** (Measure) | `1` | Числовые значения | Value, Actual, Target, Amount |

**Все строковые поля** → в роль "Категория"  
**Все числовые поля** → в роль "Значение"

---

### widget.json — формат (БЕЗ кода!)

```json
{
  "Name": "Название виджета",
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

**Property Type:**
- `0` — String
- `1` — Number  
- `2` — Boolean
- `3` — Color

---

### code.js — JavaScript код виджета

```javascript
(function() {
  var container = document.getElementById(w.general.renderTo);
  var items = w.data?.primaryData?.items || [];
  
  if (!items.length) {
    container.innerHTML = '<div style="color:#999;text-align:center;">Нет данных</div>';
    return;
  }
  
  // Твой код здесь...
  
  var chart = echarts.init(container);
  chart.setOption({
    // опции графика
  });
  
  new ResizeObserver(() => chart.resize()).observe(container);
})();
```

- Код пишется с нормальным форматированием
- Обязательно оборачивай в `(function() { ... })();`

---

### bindings.json — формат (ВАЖНО!)

```json
{
  "category": ["Category", "Segment"],
  "value": ["Actual", "Target", "Step", "Step_index"]
}
```

- `category` — массив названий колонок CSV для роли "Категория"
- `value` — массив названий колонок CSV для роли "Значение"

**Пример для bullet chart:**
```json
{
  "category": ["Category", "Segment"],
  "value": ["Actual", "Target", "Step", "Step_index"]
}
```

---

### data.csv — формат

```csv
Category,Segment,Actual,Target,Step,Step_index
A,High,75,85,20,3
A,Low,75,85,50,1
A,Medium,75,85,30,2
B,High,45,60,25,3
B,Low,45,60,40,1
```

- Первая строка — заголовки (названия полей)
- Названия полей должны совпадать с bindings.json

---

## 🔌 HTTP API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/load?name=widget-name` | GET | Загрузить виджет из папки widgets/ |
| `/api/errors` | GET | Получить ошибки выполнения |
| `/api/logs` | GET | Получить логи |
| `/api/widgets` | GET | Список всех виджетов |
| `/api/status` | GET | Статус симулятора |

### Примеры использования

```bash
# Загрузить виджет
curl "http://localhost:3000/api/load?name=example-bar-chart"

# Посмотреть ошибки
curl "http://localhost:3000/api/errors"

# Список виджетов
curl "http://localhost:3000/api/widgets"
```

---

## 📊 СТРУКТУРА ДАННЫХ w

```javascript
w.general.renderTo      // ID контейнера
w.general.width         // Ширина
w.general.height        // Высота
w.props                 // Свойства виджета
w.data.primaryData.items // Массив данных
w.colors                // Палитра цветов
```

### Структура item

```javascript
{
  keys: ["A", "High"],           // Значения категорий
  values: [100, 120],            // Числовые значения
  cols: ["Category", "Segment", "Value", "Target"],
  formattedKeys: ["A", "High"],
  formattedValues: ["100", "120"]
}
```

---

## 🎨 ШАБЛОН ВИДЖЕТА (ECharts)

```javascript
(function() {
  var container = document.getElementById(w.general.renderTo);
  var props = w.props || {};
  var items = w.data?.primaryData?.items || [];
  
  if (!items.length) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">Нет данных</div>';
    return;
  }
  
  // Очистка предыдущего графика
  var existingChart = echarts.getInstanceByDom(container);
  if (existingChart) existingChart.dispose();
  
  // Подготовка данных
  var categories = items.map(item => item.keys[0]);
  var values = items.map(item => item.values[0]);
  
  // Создание графика
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
  
  // Адаптивность
  new ResizeObserver(() => chart.resize()).observe(container);
})();
```

---

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### При создании виджета

1. **Всегда проверяй данные:**
   ```javascript
   if (!w.data?.primaryData?.items?.length) { return; }
   ```

2. **Очищай предыдущий chart:**
   ```javascript
   var existing = echarts.getInstanceByDom(container);
   if (existing) existing.dispose();
   ```

3. **Используй IIFE:**
   ```javascript
   (function() { ... })();
   ```

4. **Добавляй ResizeObserver:**
   ```javascript
   new ResizeObserver(() => chart.resize()).observe(container);
   ```

### Доступные библиотеки

- `echarts` — Apache ECharts
- `Highcharts` — Highcharts
- `lodash` / `_` — Утилиты
- `visApi()` — API Visiology

---

## 📝 ПОЛНЫЙ ПРИМЕР

### Задача: Создать круговую диаграмму

**1. Создаём widgets/pie-chart/widget.json:**

```json
{
  "Name": "Pie Chart",
  "Code": "(function() {\n  var container = document.getElementById(w.general.renderTo);\n  var items = w.data?.primaryData?.items || [];\n  \n  if (!items.length) {\n    container.innerHTML = '<div style=\"color:#999;text-align:center;padding:20px;\">Нет данных</div>';\n    return;\n  }\n  \n  var existing = echarts.getInstanceByDom(container);\n  if (existing) existing.dispose();\n  \n  var data = items.map((item, i) => ({\n    name: item.keys[0],\n    value: item.values[0],\n    itemStyle: { color: w.colors[i % w.colors.length] }\n  }));\n  \n  var chart = echarts.init(container);\n  chart.setOption({\n    backgroundColor: 'transparent',\n    tooltip: { trigger: 'item' },\n    legend: { orient: 'vertical', left: 'left', textStyle: { color: '#9aa0a6' } },\n    series: [{ type: 'pie', radius: '60%', data: data }]\n  });\n  \n  new ResizeObserver(() => chart.resize()).observe(container);\n})();",
  "DataRoles": [
    { "Name": "category", "DisplayName": "Категория", "Kind": 0 },
    { "Name": "value", "DisplayName": "Значение", "Kind": 1 }
  ],
  "Properties": []
}
```

**2. Создаём widgets/pie-chart/data.csv:**

```csv
Category,Value
Продукт A,300
Продукт B,200
Продукт C,150
Продукт D,100
```

**3. Создаём widgets/pie-chart/bindings.json:**

```json
{
  "category": ["Category"],
  "value": ["Value"]
}
```

**4. Загружаем:**

```bash
curl "http://localhost:3000/api/load?name=pie-chart"
```

**5. Проверяем в браузере через browser MCP.**

---

## 🐛 ОТЛАДКА

| Проблема | Решение |
|----------|---------|
| "Нет данных" | Проверь bindings.json и data.csv |
| График не появляется | Проверь размеры контейнера, добавь setTimeout |
| Ошибка в коде | `curl http://localhost:3000/api/errors` |
| Виджет не загружается | `curl http://localhost:3000/api/widgets` — проверь список |

---

## 📋 ЧЕКЛИСТ ДЛЯ CURSOR

```
□ Создать папку widgets/название-виджета/
□ Создать widget.json с кодом
□ Создать data.csv с тестовыми данными
□ Создать bindings.json с привязками
□ curl "http://localhost:3000/api/load?name=название-виджета"
□ browser_navigate → http://localhost:3000
□ browser_snapshot → проверить результат
□ curl "http://localhost:3000/api/errors" → проверить ошибки
□ Исправить ошибки и повторить
```
