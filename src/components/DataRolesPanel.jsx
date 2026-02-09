import React, { useState } from 'react'
import { Layers, ChevronDown, ChevronUp, X, Plus, GripVertical } from 'lucide-react'

function DataRolesPanel({ dataRoles, headers, onChange }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAddField = (roleIndex, field) => {
    if (!field) return
    const currentFields = dataRoles[roleIndex]?.fields || []
    if (!currentFields.includes(field)) {
      onChange(roleIndex, [...currentFields, field])
    }
  }

  const handleRemoveField = (roleIndex, field) => {
    const currentFields = dataRoles[roleIndex]?.fields || []
    onChange(roleIndex, currentFields.filter(f => f !== field))
  }

  const getAvailableFields = (roleIndex) => {
    const usedFields = dataRoles[roleIndex]?.fields || []
    return headers.filter(h => !usedFields.includes(h))
  }

  return (
    <div className="flex flex-col border-b border-visio-border">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-visio-bg/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-visio-accent" />
          <span className="font-medium text-visio-text">Данные (DataRoles)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-visio-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-visio-text-muted" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in space-y-4">
          <p className="text-xs text-visio-text-muted">
            Как в Visiology: 2 роли, каждая может содержать несколько полей
          </p>

          {dataRoles.map((role, roleIndex) => (
            <div key={role.Name} className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-visio-text flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${role.Kind === 0 ? 'bg-blue-400' : 'bg-green-400'}`} />
                  {role.DisplayName}
                  <span className="text-visio-text-muted font-normal">
                    ({role.Kind === 0 ? 'Категория' : 'Значение'})
                  </span>
                </label>
              </div>
              
              {/* Selected fields */}
              <div className="min-h-[36px] p-2 rounded-lg bg-visio-bg border border-visio-border mb-2">
                {role.fields && role.fields.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {role.fields.map((field, fieldIndex) => (
                      <div 
                        key={field}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-visio-accent/20 text-visio-accent text-xs group/tag"
                      >
                        <GripVertical className="w-3 h-3 text-visio-text-muted opacity-50" />
                        <span>{field}</span>
                        <button
                          onClick={() => handleRemoveField(roleIndex, field)}
                          className="ml-1 p-0.5 rounded hover:bg-visio-accent/30 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-visio-text-muted">
                    Перетащите или выберите поля...
                  </span>
                )}
              </div>

              {/* Add field dropdown */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => handleAddField(roleIndex, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-visio-bg border border-dashed border-visio-border text-visio-text-muted text-xs focus:outline-none focus:border-visio-accent appearance-none cursor-pointer hover:border-visio-accent/50 transition-colors"
                >
                  <option value="">+ Добавить поле...</option>
                  {getAvailableFields(roleIndex).map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
                <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-visio-text-muted pointer-events-none" />
              </div>

              {role.Description && (
                <p className="text-[10px] text-visio-text-muted/60 mt-1">
                  {role.Description}
                </p>
              )}
            </div>
          ))}

          {/* Data structure preview */}
          <div className="mt-3 p-3 rounded-lg bg-visio-bg/50 border border-visio-border/50">
            <div className="text-xs text-visio-text-muted mb-2">Структура w.data.primaryData:</div>
            <pre className="text-[10px] text-visio-accent font-mono overflow-auto max-h-24">
{`{
  items: [
    { keys: [${dataRoles[0]?.fields?.map(f => `"${f}"`).join(', ') || '...'}],
      values: [${dataRoles[1]?.fields?.map(f => `${f}`).join(', ') || '...'}] }
  ]
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataRolesPanel

