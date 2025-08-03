import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onOpenChange,
  title,
  children,
  className,
  showCloseButton = true
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[90vh] rounded-t-2xl border-t-4 border-t-primary/20 p-0",
          className
        )}
      >
        <SheetHeader className="pb-6 px-6 pt-6">
          {title && (
            <SheetTitle className="text-left text-xl font-semibold">
              {title}
            </SheetTitle>
          )}
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute right-6 top-6 h-12 w-12"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileBottomSheet 