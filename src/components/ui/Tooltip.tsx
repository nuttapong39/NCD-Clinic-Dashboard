// src/components/ui/Tooltip.tsx
// Professional tooltip component with hover-triggered floating content
// and intelligent auto-repositioning to prevent off-screen display
// =============================================================================

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  className?: string
}

type Position = 'top' | 'bottom' | 'left' | 'right'

interface PositionResult {
  position: Position
  style: React.CSSProperties
}

// Constants for tooltip dimensions and spacing
const TOOLTIP_WIDTH = 320 // w-80 = 320px
const TOOLTIP_HEIGHT = 120 // estimated average height
const ARROW_SIZE = 8 // border-4 = 8px total
const MARGIN = 16 // minimum margin from viewport edges

export function Tooltip({
  children,
  content,
  position = 'auto',
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [calculatedPosition, setCalculatedPosition] = useState<Position>('top')
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Calculate the best position based on viewport boundaries
  const calculateBestPosition = (): PositionResult => {
    if (!triggerRef.current) {
      return { position: 'top', style: {} }
    }

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate available space in each direction
    const spaceTop = triggerRect.top
    const spaceBottom = viewportHeight - triggerRect.bottom
    const spaceLeft = triggerRect.left
    const spaceRight = viewportWidth - triggerRect.right

    // Get tooltip dimensions (use measured or defaults)
    const tooltipWidth = tooltipRef.current?.offsetWidth || TOOLTIP_WIDTH
    const tooltipHeight = tooltipRef.current?.offsetHeight || TOOLTIP_HEIGHT

    // Check if a position would overflow
    const wouldOverflowTop = spaceTop < tooltipHeight + ARROW_SIZE + MARGIN
    const wouldOverflowBottom = spaceBottom < tooltipHeight + ARROW_SIZE + MARGIN
    const wouldOverflowLeft = spaceLeft < tooltipWidth + ARROW_SIZE + MARGIN
    const wouldOverflowRight = spaceRight < tooltipWidth + ARROW_SIZE + MARGIN

    // Determine available positions
    const availablePositions: Position[] = []
    if (!wouldOverflowTop) availablePositions.push('top')
    if (!wouldOverflowBottom) availablePositions.push('bottom')
    if (!wouldOverflowLeft) availablePositions.push('left')
    if (!wouldOverflowRight) availablePositions.push('right')

    // Choose the best position
    let bestPosition: Position
    if (position !== 'auto' && availablePositions.includes(position)) {
      bestPosition = position
    } else if (availablePositions.length > 0) {
      // Prefer the requested position or prioritize: bottom > top > right > left
      const preferenceOrder: Position[] = ['bottom', 'top', 'right', 'left']
      bestPosition = preferenceOrder.find(p => availablePositions.includes(p)) || availablePositions[0]
    } else {
      // All positions overflow, choose the one with most space
      const spaces = [
        { pos: 'top' as Position, space: spaceTop },
        { pos: 'bottom' as Position, space: spaceBottom },
        { pos: 'left' as Position, space: spaceLeft },
        { pos: 'right' as Position, space: spaceRight },
      ]
      spaces.sort((a, b) => b.space - a.space)
      bestPosition = spaces[0].pos
    }

    // Calculate positioning styles
    const style: React.CSSProperties = {}
    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    const triggerCenterY = triggerRect.top + triggerRect.height / 2

    // Calculate horizontal center position, ensuring tooltip stays in viewport
    const getCenteredLeft = () => {
      const idealLeft = triggerCenterX - tooltipWidth / 2
      const maxLeft = viewportWidth - tooltipWidth - MARGIN
      return Math.max(MARGIN, Math.min(idealLeft, maxLeft))
    }

    // Calculate vertical center position, ensuring tooltip stays in viewport
    const getCenteredTop = () => {
      const idealTop = triggerCenterY - tooltipHeight / 2
      const maxTop = viewportHeight - tooltipHeight - MARGIN
      return Math.max(MARGIN, Math.min(idealTop, maxTop))
    }

    switch (bestPosition) {
      case 'top':
        style.left = getCenteredLeft()
        style.bottom = viewportHeight - triggerRect.top + ARROW_SIZE
        break
      case 'bottom':
        style.left = getCenteredLeft()
        style.top = triggerRect.bottom + ARROW_SIZE
        break
      case 'left':
        style.right = viewportWidth - triggerRect.left + ARROW_SIZE
        style.top = getCenteredTop()
        break
      case 'right':
        style.left = triggerRect.right + ARROW_SIZE
        style.top = getCenteredTop()
        break
    }

    return { position: bestPosition, style }
  }

  const updatePosition = useCallback(() => {
    const result = calculateBestPosition()
    setCalculatedPosition(result.position)
    setTooltipStyle(result.style)
  }, [])

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      updatePosition()
    }
  }, [isVisible, updatePosition])

  // Recalculate position on window resize and clean up timeout on unmount
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        updatePosition()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isVisible, updatePosition])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 100)
  }

  const positionClasses: Record<Position, string> = {
    top: 'mb-2',
    bottom: 'mt-2',
    left: 'mr-2',
    right: 'ml-2',
  }

  const arrowClasses: Record<Position, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 dark:border-t-slate-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 dark:border-b-slate-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 dark:border-l-slate-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 dark:border-r-slate-700',
  }

  // Format content with line breaks
  const formattedContent = useMemo(() => {
    const lines = content.split('\n')
    return lines.map((line, index) => (
      <span key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ))
  }, [content])

  return (
    <div
      ref={triggerRef}
      className={cn('relative block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className={cn(
            'fixed z-50 px-5 py-4 text-sm text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-xl whitespace-normal max-w-md w-80',
            'animate-in fade-in zoom-in-95 duration-200',
            positionClasses[calculatedPosition]
          )}
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              arrowClasses[calculatedPosition]
            )}
          />
          {/* Content */}
          <div className="relative">
            {formattedContent}
          </div>
        </div>
      )}
    </div>
  )
}
