import React, { useState, useRef } from 'react'
import { Upload, Database, Table, ClipboardPaste, ChevronDown, ChevronUp } from 'lucide-react'

function DataPanel({ csvData, csvHeaders, onFileUpload, onPaste }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef(null)

  const handlePasteSubmit = () => {
    if (pasteText.trim()) {
      onPaste(pasteText)
      setShowPasteModal(false)
      setPasteText('')
    }
  }

  return (
    <div className="flex flex-col border-b border-visio-border">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-visio-bg/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-visio-accent" />
          <span className="font-medium text-visio-text">Данные</span>
          {csvData.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-visio-accent/20 text-visio-accent">
              {csvData.length} строк
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-visio-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-visio-text-muted" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          {/* Upload buttons */}
          <div className="flex gap-2 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={onFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-visio-border hover:border-visio-accent hover:bg-visio-accent/5 transition-all text-sm text-visio-text-muted hover:text-visio-accent"
            >
              <Upload className="w-4 h-4" />
              Загрузить CSV
            </button>
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-visio-border hover:border-visio-accent hover:bg-visio-accent/5 transition-all text-sm text-visio-text-muted hover:text-visio-accent"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
          </div>

          {/* Data preview */}
          {csvData.length > 0 ? (
            <div className="rounded-lg border border-visio-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-visio-bg border-b border-visio-border">
                <Table className="w-4 h-4 text-visio-text-muted" />
                <span className="text-xs text-visio-text-muted">Превью данных</span>
              </div>
              <div className="max-h-40 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-visio-bg/50">
                      {csvHeaders.map((header, i) => (
                        <th 
                          key={i} 
                          className="px-2 py-1.5 text-left font-medium text-visio-text-muted border-b border-visio-border whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-visio-bg/30">
                        {csvHeaders.map((header, j) => (
                          <td 
                            key={j} 
                            className="px-2 py-1.5 text-visio-text border-b border-visio-border/50 whitespace-nowrap"
                          >
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <div className="px-3 py-1.5 text-xs text-visio-text-muted bg-visio-bg/50 border-t border-visio-border">
                  ...и ещё {csvData.length - 5} строк
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-visio-text-muted text-sm">
              Загрузите CSV файл для начала работы
            </div>
          )}
        </div>
      )}

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-visio-panel rounded-xl border border-visio-border p-4 w-96 animate-fade-in">
            <h3 className="font-medium text-visio-text mb-3">Вставить CSV данные</h3>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Вставьте CSV данные здесь..."
              className="w-full h-40 px-3 py-2 rounded-lg bg-visio-bg border border-visio-border text-visio-text text-sm font-mono resize-none focus:outline-none focus:border-visio-accent"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowPasteModal(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-visio-border text-visio-text-muted hover:text-visio-text hover:bg-visio-bg transition-colors text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handlePasteSubmit}
                className="flex-1 px-3 py-2 rounded-lg bg-visio-accent hover:bg-visio-accent-hover text-white transition-colors text-sm font-medium"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataPanel

