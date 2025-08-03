import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobileOrTablet
}

// Hook to scroll to an element when a condition is met (e.g., when dropdown opens on mobile)
export function useScrollToElement(
  shouldScroll: boolean,
  elementRef: React.RefObject<HTMLElement>,
  delay: number = 100
) {
  React.useEffect(() => {
    if (shouldScroll && elementRef.current) {
      const timer = setTimeout(() => {
        const element = elementRef.current;
        if (!element) return;

        // Get element position and dimensions
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;
        const elementHeight = rect.height;
        
        // Estimate keyboard height and dropdown content height
        const estimatedKeyboardHeight = 300;
        const estimatedDropdownHeight = 250; // Approximate height of dropdown content
        
        // Calculate available viewport height after keyboard appears
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - estimatedKeyboardHeight;
        
        // Calculate the bottom position of the dropdown content
        const dropdownBottom = elementTop + elementHeight + estimatedDropdownHeight;
        
        // Check if dropdown content would be covered by keyboard
        if (dropdownBottom > availableHeight) {
          // Calculate how much to scroll to position the dropdown content properly
          // We want the dropdown content to be fully visible above the keyboard
          const scrollAmount = dropdownBottom - availableHeight + 20; // 20px buffer
          
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldScroll, elementRef, delay]);
}

// New hook specifically for positioning keyboard below trigger
export function useKeyboardPositioning(
  shouldPosition: boolean,
  triggerRef: React.RefObject<HTMLElement>,
  delay: number = 100
) {
  React.useEffect(() => {
    if (shouldPosition && triggerRef.current) {
      const timer = setTimeout(() => {
        const element = triggerRef.current;
        if (!element) return;

        // Get element position and dimensions
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;
        const elementHeight = rect.height;
        
        // Estimate keyboard height
        const estimatedKeyboardHeight = 300;
        
        // Calculate available viewport height after keyboard appears
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - estimatedKeyboardHeight;
        
        // Position the trigger element just above where the keyboard will appear
        // This ensures the dropdown appears above the trigger and above the keyboard
        const targetPosition = elementTop - (availableHeight - elementHeight - 20); // 20px buffer
        
        // Only scroll if the element would be covered by keyboard
        if (elementTop + elementHeight > availableHeight) {
          window.scrollBy({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldPosition, triggerRef, delay]);
}
