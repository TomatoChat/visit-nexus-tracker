import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileOptimizedMenuProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "compact"
}

export const MobileOptimizedMenu: React.FC<MobileOptimizedMenuProps> = ({
  children,
  className,
  variant = "default"
}) => {
  const isMobile = useIsMobile()
  
  return (
    <div
      className={cn(
        "flex flex-col",
        // Mobile-specific improvements
        isMobile && variant === "default" && "gap-2 p-3",
        isMobile && variant === "compact" && "gap-1 p-2",
        !isMobile && "gap-1 p-2",
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileOptimizedMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}

export const MobileOptimizedMenuItem: React.FC<MobileOptimizedMenuItemProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  active = false
}) => {
  const isMobile = useIsMobile()
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-start w-full text-left transition-colors rounded-md",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        active && "bg-accent text-accent-foreground",
        // Mobile-specific improvements
        isMobile && "py-3 px-3 text-base min-h-[44px] rounded-md",
        !isMobile && "py-2 px-2 text-sm",
        className
      )}
    >
      {children}
    </button>
  )
}

interface MobileOptimizedMenuGroupProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export const MobileOptimizedMenuGroup: React.FC<MobileOptimizedMenuGroupProps> = ({
  children,
  title,
  className
}) => {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div
          className={cn(
            "px-2 py-1 text-xs font-semibold text-muted-foreground",
            // Mobile-specific improvements
            isMobile && "px-3 py-1 text-xs"
          )}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

export {
  MobileOptimizedMenu,
  MobileOptimizedMenuItem,
  MobileOptimizedMenuGroup
} 