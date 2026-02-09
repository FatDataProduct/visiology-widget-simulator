import React, { useState, useCallback, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import Header from './components/Header'
import DataPanel from './components/DataPanel'
import CodeEditor from './components/CodeEditor'
import WidgetPreview from './components/WidgetPreview'
import DataRolesPanel from './components/DataRolesPanel'
import PropertiesPanel from './components/PropertiesPanel'
import Toast from './components/Toast'
import ImportExportModal from './components/ImportExportModal'
import ApiCommandInput from './components/ApiCommandInput'
import simulatorAPI from './api'

const DEFAULT_CODE = `// Пример кода виджета Visiology
// Объект w содержит: w.general, w.data, w.props

(function() {
  var widgetGuid = w.general.renderTo;
  var container = typeof widgetGuid === 'string' 
    ? document.getElementById(widgetGuid) 
    : widgetGuid;
  var props = w.props || {};
  
  // Получаем данные в формате Visiology
  var data = w.data;
  
  // Проверка данных
  if (!data || !data.primaryData || !data.primaryData.items || data.primaryData.items.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9aa0a6;font-size:14px;">Нет данных. Привяжите поля.</div>';
    return;
  }
  
  var items = data.primaryData.items;
  
  // Извлекаем категории и значения
  var categories = items.map(function(item) {
    return item.keys ? item.keys.join(' / ') : '';
  });
  
  var values = items.map(function(item) {
    return item.values && item.values.length > 0 ? item.values[0] : 0;
  });
  
  // Инициализация ECharts
  var existingChart = echarts.getInstanceByDom(container);
  if (existingChart) existingChart.dispose();
  
  var chart = echarts.init(container);
  
  var option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#252830',
      borderColor: '#3a3f4b',
      textStyle: { color: '#e8eaed' }
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#3a3f4b' } },
      axisLabel: { color: '#9aa0a6', rotate: props.labelRotate || 0 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#3a3f4b' } },
      axisLabel: { color: '#9aa0a6' },
      splitLine: { lineStyle: { color: '#3a3f4b', type: 'dashed' } }
    },
    series: [{
      type: props.chartType || 'bar',
      data: values,
      itemStyle: {
        color: props.barColor || '#00b4d8',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };
  
  chart.setOption(option);
  
  // ResizeObserver
  if (window.ResizeObserver) {
    new ResizeObserver(function() { 
      try { chart.resize(); } catch(e) {}
    }).observe(container);
  }
})();
`;

const SAMPLE_CSV = `Category,Segment,Actual,Target,Step,Step_index
A,High,75,85,20,3
A,Low,75,85,50,1
A,Medium,75,85,30,2
B,High,45,60,25,3
B,Low,45,60,40,1
B,Medium,45,60,35,2`;

const DEFAULT_DATA_ROLES = [
  {
    Name: crypto.randomUUID().replace(/-/g, ''),
    DisplayName: 'Категория',
    Description: 'Поля для группировки (ось X)',
    Kind: 0,
    Optional: false,
    fields: [] // выбранные колонки
  },
  {
    Name: crypto.randomUUID().replace(/-/g, ''),
    DisplayName: 'Значение',
    Description: 'Числовые поля (ось Y)',
    Kind: 1,
    Optional: false,
    fields: []
  }
];

const DEFAULT_PROPERTIES = [
  { DisplayName: 'Тип графика', PropertyName: 'chartType', Value: 'bar', Type: 0 },
  { DisplayName: 'Цвет столбцов', PropertyName: 'barColor', Value: '#00b4d8', Type: 3 },
  { DisplayName: 'Поворот подписей', PropertyName: 'labelRotate', Value: 0, Type: 1 },
];

function App() {
  const [widgetName, setWidgetName] = useState('Мой виджет')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [csvData, setCsvData] = useState([])
  const [csvHeaders, setCsvHeaders] = useState([])
  const [dataRoles, setDataRoles] = useState(DEFAULT_DATA_ROLES)
  const [properties, setProperties] = useState(DEFAULT_PROPERTIES)
  const [toast, setToast] = useState(null)
  const [showImportExport, setShowImportExport] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Ключ для принудительной перерисовки
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Debounce таймер
  const refreshTimerRef = useRef(null)
  
  // Refs для API (чтобы избежать циклических зависимостей)
  const handleImportRef = useRef(null)
  const handleCsvParseRef = useRef(null)
  const handleExportRef = useRef(null)
  const setDataRolesRef = useRef(null)

  // Автоперерисовка при изменениях
  useEffect(() => {
    if (!autoRefresh) return
    
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    
    refreshTimerRef.current = setTimeout(() => {
      setRefreshKey(prev => prev + 1)
    }, 300)
    
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [code, csvData, dataRoles, properties, autoRefresh])

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleCsvParse = useCallback((csvText) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data)
          const headers = Object.keys(results.data[0])
          setCsvHeaders(headers)
          
          // Автоматически назначаем первые поля в DataRoles
          if (headers.length >= 2) {
            setDataRoles(prev => prev.map((role, idx) => ({
              ...role,
              fields: idx === 0 ? [headers[0]] : [headers[1]]
            })))
          }
          showToast(`Загружено ${results.data.length} строк`, 'success')
        }
      },
      error: (error) => {
        showToast(`Ошибка парсинга: ${error.message}`, 'error')
      }
    })
  }, [showToast])

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === 'string') {
          handleCsvParse(text)
        }
      }
      reader.readAsText(file)
    }
  }, [handleCsvParse])

  const handleRun = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    showToast('Виджет обновлён', 'success')
  }, [showToast])

  const handleDataRoleChange = useCallback((roleIndex, fields) => {
    setDataRoles(prev => prev.map((role, idx) => 
      idx === roleIndex ? { ...role, fields } : role
    ))
  }, [])

  const handlePropertyChange = useCallback((propertyName, value) => {
    setProperties(prev => prev.map(prop => 
      prop.PropertyName === propertyName ? { ...prop, Value: value } : prop
    ))
  }, [])

  const handleAddProperty = useCallback((newProp) => {
    setProperties(prev => [...prev, newProp])
  }, [])

  const handleRemoveProperty = useCallback((propertyName) => {
    setProperties(prev => prev.filter(p => p.PropertyName !== propertyName))
  }, [])

  // Экспорт виджета
  const handleExport = useCallback(() => {
    const exportData = {
      Name: widgetName,
      Code: code,
      DataRoles: dataRoles.map(role => ({
        Name: role.Name,
        DisplayName: role.DisplayName,
        Description: role.Description,
        Kind: role.Kind,
        Optional: role.Optional
      })),
      Properties: properties,
      PropertiesJson: ''
    }
    return exportData
  }, [widgetName, code, dataRoles, properties])

  // Импорт виджета
  const handleImport = useCallback((importData) => {
    try {
      if (importData.Name) setWidgetName(importData.Name)
      if (importData.Code) setCode(importData.Code)
      if (importData.DataRoles) {
        setDataRoles(importData.DataRoles.map(role => ({
          ...role,
          fields: [] // сбрасываем привязки
        })))
      }
      if (importData.Properties) {
        setProperties(importData.Properties)
      }
      showToast('Виджет импортирован', 'success')
      setShowImportExport(false)
    } catch (e) {
      showToast('Ошибка импорта: ' + e.message, 'error')
    }
  }, [showToast])

  // Обновляем refs при изменении функций
  useEffect(() => {
    handleImportRef.current = handleImport
    handleCsvParseRef.current = handleCsvParse
    handleExportRef.current = handleExport
    setDataRolesRef.current = setDataRoles
  }, [handleImport, handleCsvParse, handleExport])

  // Загрузка демо-данных при старте
  useEffect(() => {
    handleCsvParse(SAMPLE_CSV)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling для API команд
  useEffect(() => {
    let isProcessing = false
    
    const pollInterval = setInterval(async () => {
      if (isProcessing) return // Не обрабатываем пока предыдущая команда не завершена
      
      try {
        const response = await fetch('/api/command')
        const command = await response.json()
        
        if (command && command.type === 'loadAll') {
          isProcessing = true
          console.log(`📥 Received command #${command.id}`)
          
          const { widget, csv, bindings } = command.data
          
          // Сразу отправляем подтверждение
          await fetch('/api/ack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commandId: command.id })
          })
          
          // Загружаем виджет
          if (widget) {
            console.log('📦 Loading widget:', widget.Name)
            if (widget.Name) setWidgetName(widget.Name)
            if (widget.Code) {
              console.log('📝 Setting code, length:', widget.Code.length)
              setCode(widget.Code)
            }
            if (widget.DataRoles) {
              console.log('📊 Setting DataRoles:', widget.DataRoles.length)
              setDataRoles(widget.DataRoles.map(role => ({
                ...role,
                fields: []
              })))
            }
            if (widget.Properties) {
              console.log('⚙️ Setting Properties:', widget.Properties.length)
              setProperties(widget.Properties)
            }
          }
          
          // Загружаем данные
          if (csv) {
            console.log('📄 Parsing CSV...')
            Papa.parse(csv, {
              header: true,
              skipEmptyLines: true,
              dynamicTyping: true,
              complete: (results) => {
                if (results.data && results.data.length > 0) {
                  console.log('📄 CSV parsed, rows:', results.data.length)
                  setCsvData(results.data)
                  const headers = Object.keys(results.data[0])
                  console.log('📄 CSV headers:', headers)
                  setCsvHeaders(headers)
                  
                  // Устанавливаем привязки после парсинга CSV
                  if (bindings) {
                    console.log('🔗 Applying bindings:', bindings)
                    setTimeout(() => {
                      setDataRoles(prev => prev.map((role, idx) => {
                        if (Array.isArray(bindings)) {
                          return { ...role, fields: bindings[idx] || [] }
                        } else {
                          const fields = idx === 0 
                            ? (bindings.category || bindings.dimension || bindings.keys || [])
                            : (bindings.value || bindings.measure || bindings.values || [])
                          return { ...role, fields }
                        }
                      }))
                      // Принудительно обновляем виджет
                      console.log('🔄 Forcing refresh...')
                      setRefreshKey(prev => prev + 1)
                    }, 50)
                  } else {
                    // Автопривязка первых полей
                    console.log('🔗 Auto-binding first fields')
                    if (headers.length >= 2) {
                      setDataRoles(prev => prev.map((role, idx) => ({
                        ...role,
                        fields: idx === 0 ? [headers[0]] : [headers[1]]
                      })))
                    }
                    setRefreshKey(prev => prev + 1)
                  }
                }
              }
            })
          } else if (bindings) {
            // Привязки без CSV
            setDataRoles(prev => prev.map((role, idx) => {
              if (Array.isArray(bindings)) {
                return { ...role, fields: bindings[idx] || [] }
              } else {
                const fields = idx === 0 
                  ? (bindings.category || bindings.dimension || bindings.keys || [])
                  : (bindings.value || bindings.measure || bindings.values || [])
                return { ...role, fields }
              }
            }))
            setRefreshKey(prev => prev + 1)
          }
          
          showToast(`Виджет "${widget?.Name || 'unknown'}" загружен через API`, 'success')
          
          // Отправляем результат и сбрасываем флаг
          setTimeout(async () => {
            try {
              await fetch('/api/result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  commandId: command.id,
                  success: true,
                  errors: simulatorAPI.getErrors(),
                  logs: simulatorAPI.getLogs()
                })
              })
            } catch (e) {
              console.error('Failed to send result:', e)
            }
            isProcessing = false
          }, 1000) // Даём время на парсинг CSV и обновление
        }
      } catch (e) {
        isProcessing = false
        console.error('Polling error:', e)
      }
    }, 500)

    return () => clearInterval(pollInterval)
  }, [showToast])

  // Экспорт API для Cursor IDE
  useEffect(() => {
    window.VISIO_SIMULATOR = window.VISIO_SIMULATOR || {}
    
    window.VISIO_SIMULATOR.loadWidget = (jsonOrString) => {
      try {
        const data = typeof jsonOrString === 'string' ? JSON.parse(jsonOrString) : jsonOrString
        if (handleImportRef.current) handleImportRef.current(data)
        simulatorAPI.logSuccess('Widget loaded successfully')
        return { success: true }
      } catch (e) {
        simulatorAPI.logError('api', 'Failed to load widget: ' + e.message)
        return { success: false, error: e.message }
      }
    }
    
    window.VISIO_SIMULATOR.loadData = (csvString) => {
      try {
        if (handleCsvParseRef.current) handleCsvParseRef.current(csvString)
        simulatorAPI.logSuccess('Data loaded successfully')
        return { success: true }
      } catch (e) {
        simulatorAPI.logError('api', 'Failed to load data: ' + e.message)
        return { success: false, error: e.message }
      }
    }
    
    window.VISIO_SIMULATOR.refresh = () => {
      setRefreshKey(prev => prev + 1)
      return { success: true }
    }
    
    window.VISIO_SIMULATOR.exportWidget = () => {
      if (handleExportRef.current) return handleExportRef.current()
      return null
    }
    
    window.VISIO_SIMULATOR.setCode = (newCode) => {
      setCode(newCode)
      return { success: true }
    }
    
    window.VISIO_SIMULATOR.getCode = () => code
    
    window.VISIO_SIMULATOR.setProperties = (props) => {
      setProperties(props)
      return { success: true }
    }
    
    window.VISIO_SIMULATOR.getProperties = () => properties
    
    window.VISIO_SIMULATOR.getErrors = () => simulatorAPI.getErrors()
    window.VISIO_SIMULATOR.clearErrors = () => simulatorAPI.clearErrors()
    window.VISIO_SIMULATOR.getLogs = () => simulatorAPI.getLogs()
    
    // Установить привязки полей к ролям
    // bindings: { category: ["Category", "Segment"], value: ["Actual", "Target"] }
    // или bindings: [["Category", "Segment"], ["Actual", "Target"]]
    window.VISIO_SIMULATOR.setBindings = (bindings) => {
      try {
        if (setDataRolesRef.current) {
          if (Array.isArray(bindings)) {
            // Формат массива: [[categoryFields], [valueFields]]
            setDataRolesRef.current(prev => prev.map((role, idx) => ({
              ...role,
              fields: bindings[idx] || []
            })))
          } else {
            // Формат объекта: { category: [...], value: [...] }
            setDataRolesRef.current(prev => prev.map((role, idx) => ({
              ...role,
              fields: idx === 0 
                ? (bindings.category || bindings.dimension || bindings.keys || [])
                : (bindings.value || bindings.measure || bindings.values || [])
            })))
          }
        }
        simulatorAPI.logSuccess('Bindings set successfully')
        return { success: true }
      } catch (e) {
        simulatorAPI.logError('api', 'Failed to set bindings: ' + e.message)
        return { success: false, error: e.message }
      }
    }
    
    // Получить текущие привязки
    window.VISIO_SIMULATOR.getBindings = () => {
      return {
        category: dataRoles[0]?.fields || [],
        value: dataRoles[1]?.fields || []
      }
    }
    
    // Комбинированный метод - загрузить всё сразу
    window.VISIO_SIMULATOR.loadAll = ({ widget, csv, bindings }) => {
      try {
        if (widget && handleImportRef.current) {
          const data = typeof widget === 'string' ? JSON.parse(widget) : widget
          handleImportRef.current(data)
        }
        if (csv && handleCsvParseRef.current) {
          handleCsvParseRef.current(csv)
        }
        // bindings устанавливаем с небольшой задержкой, чтобы CSV успел распарситься
        if (bindings) {
          setTimeout(() => {
            window.VISIO_SIMULATOR.setBindings(bindings)
          }, 100)
        }
        simulatorAPI.logSuccess('All data loaded successfully')
        return { success: true }
      } catch (e) {
        simulatorAPI.logError('api', 'Failed to load all: ' + e.message)
        return { success: false, error: e.message }
      }
    }
    
    console.log('%c[VISIO_SIMULATOR] API ready. Use window.VISIO_SIMULATOR to interact.', 'color: #00b4d8; font-weight: bold;')
  }, [code, properties, dataRoles])

  // Преобразование данных в формат Visiology
  const getVisiologyData = useCallback(() => {
    if (!csvData.length || !dataRoles.length) return null
    
    const categoryFields = dataRoles[0]?.fields || []
    const valueFields = dataRoles[1]?.fields || []
    const allCols = [...categoryFields, ...valueFields]
    
    // Создаём metadata как массив объектов (как в Visiology)
    const metadataArray = allCols.map((colName, idx) => ({
      displayName: colName,
      name: colName,
      index: idx,
      // groupingType: 0 = values, 1 = keys, 2 = subkeys
      groupingType: valueFields.includes(colName) ? 0 : 1,
      type: valueFields.includes(colName) ? 'measure' : 'dimension',
      dataType: valueFields.includes(colName) ? 'number' : 'string',
      dataColumn: {
        dataRoleName: valueFields.includes(colName) ? 'values' : 'keys'
      }
    }))
    
    // Форматирование значений
    const formatValue = (val, isNumber) => {
      if (isNumber) {
        if (typeof val === 'number') {
          if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M'
          if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'K'
          return val.toLocaleString('ru-RU')
        }
        return String(val)
      }
      return String(val)
    }
    
    // Агрегация данных по ключам (как в Visiology)
    const aggregatedMap = new Map()
    
    csvData.forEach((row) => {
      const keys = categoryFields.map(field => row[field])
      const keyString = keys.join('|||')
      
      const values = valueFields.map(field => {
        const val = row[field]
        return typeof val === 'number' ? val : parseFloat(val) || 0
      })
      
      if (aggregatedMap.has(keyString)) {
        const existing = aggregatedMap.get(keyString)
        existing.values = existing.values.map((v, i) => v + values[i])
        existing.count += 1
      } else {
        aggregatedMap.set(keyString, {
          keys,
          values,
          count: 1
        })
      }
    })
    
    // Преобразуем Map в массив items (как в Visiology)
    const items = Array.from(aggregatedMap.values()).map((item) => ({
      keys: item.keys,
      values: item.values,
      // Форматированные значения как в Visiology
      formattedKeys: item.keys.map(k => String(k)),
      formattedValues: item.values.map(v => formatValue(v, true)),
      cols: allCols,
      metadata: metadataArray,
      // Вложенные items для drill-down (пустой массив если нет вложенности)
      items: [],
      _count: item.count
    }))
    
    return {
      primaryData: {
        items,
        cols: allCols,
        metadata: metadataArray
      }
    }
  }, [csvData, dataRoles])

  // Преобразование properties в объект props
  const getPropsObject = useCallback(() => {
    const props = {}
    properties.forEach(prop => {
      props[prop.PropertyName] = prop.Value
    })
    return props
  }, [properties])

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden">
      <Header 
        widgetName={widgetName}
        onWidgetNameChange={setWidgetName}
        onRun={handleRun} 
        onImportExport={() => setShowImportExport(true)}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Левая панель - Данные и DataRoles */}
        <div className="w-80 flex flex-col border-r border-visio-border bg-visio-panel overflow-hidden">
          <DataPanel 
            csvData={csvData}
            csvHeaders={csvHeaders}
            onFileUpload={handleFileUpload}
            onPaste={handleCsvParse}
          />
          <DataRolesPanel 
            dataRoles={dataRoles}
            headers={csvHeaders}
            onChange={handleDataRoleChange}
          />
          <PropertiesPanel
            properties={properties}
            onChange={handlePropertyChange}
            onAdd={handleAddProperty}
            onRemove={handleRemoveProperty}
          />
        </div>
        
        {/* Центральная панель - Редактор кода */}
        <div className="flex-1 flex flex-col border-r border-visio-border min-w-0">
          <CodeEditor 
            code={code}
            onChange={setCode}
            onImportJson={handleImport}
          />
        </div>
        
        {/* Правая панель - Превью виджета */}
        <div className="flex-1 flex flex-col bg-visio-bg min-w-0">
          <WidgetPreview 
            key={refreshKey}
            code={code}
            data={getVisiologyData()}
            props={getPropsObject()}
          />
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {showImportExport && (
        <ImportExportModal
          onClose={() => setShowImportExport(false)}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}

      {/* API Command Input для Cursor IDE */}
      <ApiCommandInput 
        onExecute={(data) => {
          // Если это объект с widget/csv/bindings - вызываем loadAll
          if (data.widget || data.csv || data.bindings) {
            return window.VISIO_SIMULATOR.loadAll(data)
          }
          // Иначе пытаемся как loadWidget
          if (data.Code || data.Name) {
            return window.VISIO_SIMULATOR.loadWidget(data)
          }
          return { success: false, error: 'Unknown command format' }
        }}
      />
    </div>
  )
}

export default App
