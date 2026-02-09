import React from 'react'
import { Play, Zap, Download, Upload, RefreshCw } from 'lucide-react'

function Header({ widgetName, onWidgetNameChange, onRun, onImportExport, autoRefresh, onAutoRefreshChange }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-visio-panel border-b border-visio-border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-visio-accent to-blue-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => onWidgetNameChange(e.target.value)}
              className="text-lg font-semibold text-visio-text leading-tight bg-transparent border-none outline-none focus:ring-1 focus:ring-visio-accent rounded px-1 -ml-1"
              placeholder="Название виджета"
            />
            <p className="text-xs text-visio-text-muted">
              Visiology Widget Simulator
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Auto-refresh toggle */}
        <button
          onClick={() => onAutoRefreshChange(!autoRefresh)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
            ${autoRefresh 
              ? 'bg-visio-accent/20 text-visio-accent border border-visio-accent/30' 
              : 'text-visio-text-muted hover:text-visio-text hover:bg-visio-bg border border-transparent'
            }
          `}
          title={autoRefresh ? 'Авто-обновление включено' : 'Авто-обновление выключено'}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          Авто
        </button>

        {/* Import/Export button */}
        <button
          onClick={onImportExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors text-sm border border-visio-border"
        >
          <Download className="w-4 h-4" />
          <Upload className="w-4 h-4 -ml-2" />
          Импорт/Экспорт
        </button>
        
        {/* Run button */}
        <button
          onClick={onRun}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-visio-accent hover:bg-visio-accent-hover text-white shadow-lg shadow-visio-accent/25 hover:shadow-visio-accent/40 transition-all duration-200"
        >
          <Play className="w-4 h-4" />
          Запустить
        </button>
      </div>
    </header>
  )
}

export default Header
