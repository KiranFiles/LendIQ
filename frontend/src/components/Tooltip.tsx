import { ReactNode, useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Position of the tooltip relative to the trigger. Default: "top" */
  position?: "top" | "bottom" | "left" | "right";
  /** Max width of tooltip box in px. Default 240 */
  maxWidth?: number;
}

/**
 * Clean, accessible tooltip.
 * Wraps any trigger element; shows rich content on hover/focus.
 */
export default function Tooltip({
  content,
  children,
  position = "top",
  maxWidth = 240,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (safety)
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible]);

  const posClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<string, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {/* Tooltip bubble */}
      <div
        role="tooltip"
        style={{ maxWidth, width: "max-content" }}
        className={`
          absolute z-[100] ${posClasses[position]}
          bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl
          leading-relaxed pointer-events-none
          transition-all duration-150
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        {content}
        {/* Arrow */}
        <span
          className={`absolute border-4 ${arrowClasses[position]}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
