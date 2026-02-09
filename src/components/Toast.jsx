import React from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

function Toast({ message, type = 'info' }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-visio-success" />,
    error: <AlertCircle className="w-5 h-5 text-visio-error" />,
    warning: <AlertCircle className="w-5 h-5 text-visio-warning" />,
    info: <Info className="w-5 h-5 text-visio-accent" />,
  }

  const backgrounds = {
    success: 'bg-visio-success/10 border-visio-success/30',
    error: 'bg-visio-error/10 border-visio-error/30',
    warning: 'bg-visio-warning/10 border-visio-warning/30',
    info: 'bg-visio-accent/10 border-visio-accent/30',
  }

  return (
    <div 
      className={`toast flex items-center gap-3 ${backgrounds[type]} border backdrop-blur-sm`}
    >
      {icons[type]}
      <span className="text-visio-text text-sm">{message}</span>
    </div>
  )
}

export default Toast

