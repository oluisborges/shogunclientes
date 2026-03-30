"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useEffect, useState, useRef } from "react"

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  label?: string
}

export function CircularProgress({
  value,
  max,
  size = 120,
  label,
}: CircularProgressProps) {
  const [isLightMode, setIsLightMode] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(document.documentElement.classList.contains('light'))
    }
    
    checkTheme()
    
    // Observer para mudanças de tema
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])
  
  // Força cores dos textos quando mudar o tema
  useEffect(() => {
    const forceTextColors = () => {
      const textColor = isLightMode ? '#374151' : '#E8F0EB'
      const mutedColor = isLightMode ? '#9CA3AF' : '#808080'
      
      // FORÇA GLOBAL - NENHUM TEXTO BRANCO NO MODO CLARO
      if (isLightMode) {
        // Força TODOS os elementos no modo claro
        const allElements = document.querySelectorAll('*')
        allElements.forEach(element => {
          const htmlElement = element as HTMLElement
          const computedStyle = window.getComputedStyle(htmlElement)
          const currentColor = computedStyle.color
          
          // Se a cor for branca ou muito clara, força para cinza escuro
          if (currentColor === 'rgb(255, 255, 255)' || 
              currentColor === '#ffffff' || 
              currentColor === '#FFFFFF' ||
              currentColor.includes('255, 255, 255')) {
            
            // Verifica se não está em um fundo verde (deve ser branco)
            const bgColor = computedStyle.backgroundColor
            const isGreenBg = bgColor.includes('149, 214, 0') || 
                             bgColor.includes('10, 185, 129') ||
                             bgColor.includes('95, 214, 0')
            
            if (!isGreenBg) {
              htmlElement.style.setProperty('color', '#374151', 'important')
              htmlElement.style.setProperty('fill', '#374151', 'important')
            }
          }
        })
        
        // Força específico para gráficos
        const chartElements = document.querySelectorAll('.recharts-text, .recharts-label, tspan, span')
        chartElements.forEach(element => {
          const htmlElement = element as HTMLElement
          htmlElement.style.setProperty('color', '#374151', 'important')
          htmlElement.style.setProperty('fill', '#374151', 'important')
        })
      }
      
      // Força o texto principal (percentagem)
      if (percentRef.current) {
        percentRef.current.style.color = textColor
        percentRef.current.style.setProperty('color', textColor, 'important')
        percentRef.current.style.setProperty('fill', textColor, 'important')
      }
      
      // Força o label secundário
      if (labelRef.current) {
        labelRef.current.style.color = mutedColor
        labelRef.current.style.setProperty('color', mutedColor, 'important')
        labelRef.current.style.setProperty('fill', mutedColor, 'important')
      }
      
      // Força todos os spans dentro do container
      if (textRef.current) {
        const spans = textRef.current.querySelectorAll('span')
        spans.forEach(span => {
          const htmlSpan = span as HTMLSpanElement
          htmlSpan.style.color = textColor
          htmlSpan.style.setProperty('color', textColor, 'important')
          htmlSpan.style.setProperty('fill', textColor, 'important')
        })
      }
    }
    
    forceTextColors()
    
    // Força continuamente no modo claro
    if (isLightMode) {
      const interval = setInterval(forceTextColors, 25) // Mais frequente
      return () => clearInterval(interval)
    }
  }, [isLightMode])
  
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const data = [
    { name: "filled", value: percent },
    { name: "empty", value: 100 - percent },
  ]
  
  // Cores dinâmicas baseadas no tema
  const filledColor = isLightMode ? "#10B981" : "#95D600"
  const emptyColor = isLightMode ? "#E5E5E5" : "#1F4438"
  const textColor = isLightMode ? "#374151" : "#E8F0EB"
  const mutedColor = isLightMode ? "#9CA3AF" : "#808080"

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={filledColor} />
            <Cell fill={emptyColor} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div 
        ref={textRef}
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ color: textColor }}
      >
        <span 
          ref={percentRef}
          className="font-[var(--font-data)] text-lg font-bold"
          style={{ 
            color: textColor,
            fill: textColor,
            WebkitTextFillColor: textColor
          }}
        >
          {Math.round(percent)}%
        </span>
        {label && (
          <span 
            ref={labelRef}
            className="text-[9px] font-[var(--font-display)] uppercase"
            style={{ 
              color: mutedColor,
              fill: mutedColor,
              WebkitTextFillColor: mutedColor
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
