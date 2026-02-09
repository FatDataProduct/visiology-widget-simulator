import React, { useState, useRef } from 'react'
import { Terminal, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

function ApiCommandInput({ onExecute }) {
  const [command, setCommand] = useState('')
  const [result, setResult] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef(null)

  const handleExecute = () => {
    if (!command.trim()) return
    
    try {
      // Пытаемся распарсить как JSON и выполнить loadAll
      const parsed = JSON.parse(command)
      
      if (onExecute) {
        const execResult = onExecute(parsed)
        setResult({ success: true, message: 'Команда выполнена успешно', data: execResult })
      }
      
      setCommand('')
    } catch (e) {
      // Если не JSON, пытаемся выполнить как команду
      try {
        // eslint-disable-next-line no-eval
        const evalResult = eval(command)
        setResult({ success: true, message: 'Выполнено', data: evalResult })
        setCommand('')
      } catch (evalError) {
        setResult({ success: false, message: evalError.message })
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleExecute()
    }
  }

  const handlePaste = (e) => {
    // Автоматически выполняем при вставке JSON
    setTimeout(() => {
      const pastedText = inputRef.current?.value || ''
      if (pastedText.trim().startsWith('{') || pastedText.trim().startsWith('VISIO_SIMULATOR')) {
        // Даём небольшую задержку и выполняем
        setTimeout(() => {
          handleExecute()
        }, 100)
      }
    }, 50)
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50"
      data-testid="api-command-input"
    >
      {/* Collapsed button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-visio-panel border border-visio-border text-visio-text-muted hover:text-visio-text hover:border-visio-accent transition-all shadow-lg"
          title="API Command Input (для Cursor IDE)"
          data-testid="api-toggle"
        >
          <Terminal className="w-4 h-4" />
          <span className="text-xs">API</span>
        </button>
      )}

      {/* Expanded input */}
      {isExpanded && (
        <div className="w-96 bg-visio-panel border border-visio-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-visio-bg border-b border-visio-border">
            <div className="flex items-center gap-2 text-xs text-visio-text-muted">
              <Terminal className="w-3 h-3" />
              <span>API Command Input</span>
              <span className="text-visio-accent">(для Cursor IDE)</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-visio-text-muted hover:text-visio-text"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Input */}
          <div className="p-3">
            <textarea
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder='Вставь JSON для loadAll или команду VISIO_SIMULATOR...'
              className="w-full h-24 px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-xs font-mono resize-none focus:outline-none focus:border-visio-accent"
              data-testid="api-input"
            />
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-visio-text-muted">
                Ctrl+Enter для выполнения
              </span>
              <button
                onClick={handleExecute}
                disabled={!command.trim()}
                className="px-3 py-1.5 rounded-lg bg-visio-accent text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-visio-accent-hover transition-colors"
                data-testid="api-execute"
              >
                Выполнить
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`px-3 py-2 border-t border-visio-border ${result.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className="flex items-center gap-2 text-xs">
                {result.success ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
                <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </span>
              </div>
              {result.data && (
                <pre className="mt-1 text-xs text-visio-text-muted overflow-auto max-h-20">
                  {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ApiCommandInput

