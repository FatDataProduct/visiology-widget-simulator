import React, { useEffect, useRef, useState } from 'react'
import { Eye, AlertCircle, CheckCircle, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import * as echarts from 'echarts'
import Highcharts from 'highcharts'
import HighchartsMore from 'highcharts/highcharts-more'
import _ from 'lodash'
import simulatorAPI from '../api'

// Initialize Highcharts modules
if (typeof HighchartsMore === 'function') {
  HighchartsMore(Highcharts)
}

// Default color palette (similar to Visiology)
const DEFAULT_COLORS = [
  '#00b4d8', '#0077b6', '#90e0ef', '#caf0f8',
  '#ff6b6b', '#ee5a24', '#f39c12', '#27ae60',
  '#9b59b6', '#3498db', '#1abc9c', '#e74c3c',
  '#2ecc71', '#f1c40f', '#e67e22', '#9c88ff',
  '#00d2d3', '#ff9ff3', '#54a0ff', '#5f27cd'
]

// Create visApi mock - полная эмуляция API Visiology
function createVisApi(widgetGuid, selectedValuesState) {
  // Хранилище для эмуляции DrillDown
  const drillState = {
    level: 0,
    path: []
  }
  
  // Хранилище для listeners
  const listeners = {
    selectedValuesChanged: [],
    widgetLoaded: [],
    allWidgetsLoaded: [],
    drillDown: [],
    drillUp: []
  }
  
  return function visApi() {
    return {
      // ============ ФИЛЬТРЫ ============
      
      // Получить выбранные значения фильтра
      getSelectedValues: (guid) => {
        return selectedValuesState.current || []
      },
      
      // Установить фильтр (основной метод Visiology)
      setFilterSelectedValues: (guid, values, callback) => {
        selectedValuesState.current = values
        console.log('visApi: setFilterSelectedValues', guid, values)
        // Уведомляем listeners
        listeners.selectedValuesChanged.forEach(l => {
          if (!l.widgetGuid || l.widgetGuid === guid) {
            l.callback({ selectedValues: values, widgetGuid: guid })
          }
        })
        if (callback) callback()
      },
      
      // Установить фильтр по датам
      setDateFilterSelectedValues: (guid, dates) => {
        console.log('visApi: setDateFilterSelectedValues', guid, dates)
      },
      
      // Legacy методы
      setSelectedValues: (guid, values) => {
        selectedValuesState.current = values
        console.log('visApi: setSelectedValues', values)
      },
      
      clearSelection: (guid) => {
        selectedValuesState.current = []
        console.log('visApi: clearSelection')
      },
      
      // ============ DRILLDOWN ============
      
      // Уровень DrillDown
      getDrillLevel: (guid) => {
        return drillState.level
      },
      
      // Путь DrillDown (хлебные крошки)
      getDrillPath: (guid) => {
        return drillState.path
      },
      
      // Выполнить DrillDown по значению
      drillDown: (guid, values) => {
        drillState.level++
        drillState.path.push(values)
        console.log('visApi: drillDown', guid, values, 'level:', drillState.level)
        // Уведомляем listeners
        listeners.drillDown.forEach(l => {
          if (!l.widgetGuid || l.widgetGuid === guid) {
            l.callback({ 
              widgetGuid: guid, 
              hierarchyPath: drillState.path,
              selectedValues: values 
            })
          }
        })
      },
      
      // Вернуться на уровень выше
      drillUp: (guid) => {
        if (drillState.level > 0) {
          drillState.level--
          drillState.path.pop()
        }
        console.log('visApi: drillUp', guid, 'level:', drillState.level)
        // Уведомляем listeners
        listeners.drillUp.forEach(l => {
          if (!l.widgetGuid || l.widgetGuid === guid) {
            l.callback({ 
              widgetGuid: guid, 
              hierarchyPath: drillState.path 
            })
          }
        })
      },
      
      // Показать/скрыть панель навигации
      showControlPanel: (guid) => console.log('visApi: showControlPanel', guid),
      hideControlPanel: (guid) => console.log('visApi: hideControlPanel', guid),
      
      // ============ ПОДПИСКИ НА СОБЫТИЯ ============
      
      onSelectedValuesChangedListener: (config, callback) => {
        listeners.selectedValuesChanged.push({ ...config, callback })
        console.log('visApi: onSelectedValuesChangedListener registered')
      },
      
      onWidgetLoadedListener: (config, callback) => {
        listeners.widgetLoaded.push({ ...config, callback })
        // Сразу вызываем, т.к. виджет уже загружен в симуляторе
        setTimeout(() => callback({ widgetGuid: config.widgetGuid || widgetGuid }), 100)
      },
      
      onAllWidgetsLoadedListener: (config, callback) => {
        listeners.allWidgetsLoaded.push({ ...config, callback })
        // Сразу вызываем
        setTimeout(() => callback(), 100)
      },
      
      onDrillDownListener: (config, callback) => {
        listeners.drillDown.push({ ...config, callback })
      },
      
      onDrillUpListener: (config, callback) => {
        listeners.drillUp.push({ ...config, callback })
      },
      
      // ============ ЭКСПОРТ ============
      
      exportDashboard: (format) => {
        console.log('visApi: exportDashboard', format)
        alert(`Экспорт в формате ${format} недоступен в симуляторе`)
      },
      
      exportExcelWidgetData: (guid) => {
        console.log('visApi: exportExcelWidgetData', guid)
      },
      
      exportAllWidgetData: (guid) => {
        console.log('visApi: exportAllWidgetData', guid)
      },
      
      // ============ ДАННЫЕ ============
      
      getWidgetDataByGuid: (guid) => {
        return Promise.resolve({
          data: {},
          selected: selectedValuesState.current
        })
      },
      
      getWidgetByGuid: (guid) => {
        console.warn('visApi: getWidgetByGuid - структура может измениться')
        return null
      },
      
      // ============ ПРОЧЕЕ ============
      
      getWidgetSettings: (guid) => ({}),
      
      getSheetZoom: () => 100,
      
      getFilterIsOpen: (guid) => false,
      
      getWidgets: () => [{ guid: widgetGuid }],
      
      getSelectedWidgets: () => [],
      
      showTooltip: (content, x, y) => console.log('visApi: showTooltip', content),
      
      hideTooltip: () => console.log('visApi: hideTooltip'),
      
      refresh: (guid) => console.log('visApi: refresh'),
      
      getFilteredData: (guid) => [],
      
      applyFilter: (guid, filter) => console.log('visApi: applyFilter', filter),
      
      removeFilter: (guid) => console.log('visApi: removeFilter'),
      
      getCurrentFilters: () => [],
      
      navigateToDashboard: (dashboardId) => console.log('visApi: navigateToDashboard', dashboardId),
      
      openUrl: (url, target) => window.open(url, target || '_blank'),
      
      showMessage: (message, type) => console.log(`visApi: showMessage [${type}]`, message),
      
      formatValue: (value, format) => {
        if (format === 'currency') return `$${value.toLocaleString()}`
        if (format === 'percent') return `${(value * 100).toFixed(1)}%`
        if (format === 'number') return value.toLocaleString()
        return String(value)
      },
      
      getLocale: () => 'ru-RU',
      
      getTheme: () => 'dark'
    }
  }
}

function WidgetPreview({ code, data, props }) {
  const containerRef = useRef(null)
  const widgetContainerRef = useRef(null)
  const selectedValuesRef = useRef([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [executionTime, setExecutionTime] = useState(null)
  const cleanupRef = useRef(null)
  const chartInstanceRef = useRef(null)

  useEffect(() => {
    if (!widgetContainerRef.current || !code) return

    setIsLoading(true)
    setError(null)

    // Cleanup previous execution
    if (cleanupRef.current) {
      try {
        cleanupRef.current()
      } catch (e) {
        console.warn('Cleanup error:', e)
      }
      cleanupRef.current = null
    }

    // Clear container
    const container = widgetContainerRef.current
    
    // Dispose any existing echarts instance
    const existingEChart = echarts.getInstanceByDom(container)
    if (existingEChart) {
      existingEChart.dispose()
    }
    
    // Dispose any existing Highcharts instance
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.destroy()
      } catch (e) {}
      chartInstanceRef.current = null
    }
    
    container.innerHTML = ''

    const startTime = performance.now()

    // Generate a unique ID for the container
    const widgetGuid = `widget-${Date.now()}`
    container.id = widgetGuid

    // Create visApi for this widget
    const visApi = createVisApi(widgetGuid, selectedValuesRef)

    // Create the w object (Visiology API simulation)
    const w = {
      general: {
        renderTo: widgetGuid,  // В Visiology это string ID
        width: container.clientWidth || 400,
        height: container.clientHeight || 300,
        // Дополнительные свойства Visiology
        combineSmallSectors: false,
        combineThreshold: 5,
        title: '',
        subtitle: '',
        backgroundColor: 'transparent',
      },
      data: data || { primaryData: { items: [], cols: [] } },
      props: props || {},
      colors: DEFAULT_COLORS,
      // Additional Visiology properties
      locale: 'ru-RU',
      theme: 'dark',
      formatters: {
        number: (val) => val?.toLocaleString('ru-RU') || '0',
        currency: (val) => `${val?.toLocaleString('ru-RU') || '0'} ₽`,
        percent: (val) => `${((val || 0) * 100).toFixed(1)}%`,
        date: (val) => new Date(val).toLocaleDateString('ru-RU'),
      }
    }

    // Execute the code
    const timeoutId = setTimeout(() => {
      try {
        // Wrap Highcharts.chart to capture instance
        const wrappedHighcharts = { ...Highcharts }
        const originalChart = Highcharts.chart
        wrappedHighcharts.chart = function(...args) {
          const chart = originalChart.apply(Highcharts, args)
          chartInstanceRef.current = chart
          return chart
        }

        // Create a function that has access to w, echarts, Highcharts, lodash, visApi
        const executeCode = new Function(
          'w', 
          'echarts', 
          'Highcharts',
          'lodash', 
          '_',
          'visApi',
          `
          "use strict";
          try {
            ${code}
          } catch (e) {
            throw e;
          }
        `)

        try {
          const result = executeCode(w, echarts, wrappedHighcharts, _, _, visApi)
          
          // If the code returns a cleanup function, store it
          if (typeof result === 'function') {
            cleanupRef.current = result
          }

          const execTime = Math.round(performance.now() - startTime)
          setExecutionTime(execTime)
          setIsLoading(false)
          simulatorAPI.logSuccess(`Widget executed successfully in ${execTime}ms`)
        } catch (e) {
          console.error('Widget execution error:', e)
          simulatorAPI.logError('widget_execution', e.message, { stack: e.stack })
          setError(e.message)
          setIsLoading(false)
          setExecutionTime(null)
        }
      } catch (e) {
        console.error('Widget compilation error:', e)
        simulatorAPI.logError('widget_compilation', e.message, { stack: e.stack })
        setError(e.message)
        setIsLoading(false)
        setExecutionTime(null)
      }
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      if (cleanupRef.current) {
        try {
          cleanupRef.current()
        } catch (e) {
          console.warn('Cleanup error:', e)
        }
      }
      // Dispose echarts on unmount
      const chart = echarts.getInstanceByDom(container)
      if (chart) {
        chart.dispose()
      }
      // Dispose Highcharts
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.destroy()
        } catch (e) {}
      }
    }
  }, [code, data, props])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-visio-bg' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-visio-panel border-b border-visio-border">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-visio-accent" />
          <span className="font-medium text-visio-text">Превью виджета</span>
          {isLoading && (
            <Loader2 className="w-4 h-4 text-visio-accent animate-spin" />
          )}
          {!isLoading && !error && executionTime !== null && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-visio-success/20 text-visio-success">
              <CheckCircle className="w-3 h-3" />
              {executionTime}ms
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-visio-error/20 text-visio-error">
              <AlertCircle className="w-3 h-3" />
              Ошибка
            </span>
          )}
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Preview container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-50" />
        
        {/* Widget wrapper - для поддержки parentElement */}
        <div 
          className="absolute inset-4 rounded-xl bg-visio-panel/80 backdrop-blur border border-visio-border flex flex-col"
          style={{ 
            overflow: 'visible'
          }}
        >
          {/* Widget container - сюда рендерится виджет */}
          <div 
            ref={widgetContainerRef}
            className="flex-1"
            style={{ 
              width: '100%',
              minHeight: '300px',
              position: 'relative'
            }}
          />
        </div>

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-4 rounded-xl bg-visio-error/10 border border-visio-error/30 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <AlertCircle className="w-12 h-12 text-visio-error mx-auto mb-4" />
              <h3 className="text-visio-error font-medium mb-2">Ошибка выполнения</h3>
              <pre className="text-sm text-visio-text-muted bg-visio-bg/50 rounded-lg p-3 text-left overflow-auto max-h-40">
                {error}
              </pre>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-4 rounded-xl bg-visio-bg/50 backdrop-blur flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-visio-accent animate-spin mx-auto mb-2" />
              <span className="text-sm text-visio-text-muted">Выполнение кода...</span>
            </div>
          </div>
        )}
      </div>

      {/* API Reference Footer */}
      <div className="px-4 py-2 bg-visio-panel/50 border-t border-visio-border">
        <div className="flex items-center gap-3 text-xs text-visio-text-muted overflow-x-auto">
          <span className="font-medium text-visio-text flex-shrink-0">API:</span>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-visio-accent whitespace-nowrap">w.data.primaryData</code>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-visio-accent whitespace-nowrap">w.props</code>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-visio-accent whitespace-nowrap">w.colors</code>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-green-400 whitespace-nowrap">echarts</code>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-blue-400 whitespace-nowrap">Highcharts</code>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-purple-400 whitespace-nowrap">visApi()</code>
          <code className="px-1.5 py-0.5 rounded bg-visio-bg text-yellow-400 whitespace-nowrap">lodash / _</code>
        </div>
      </div>
    </div>
  )
}

export default WidgetPreview
