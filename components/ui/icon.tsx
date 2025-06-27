import { cn } from "@/lib/utils";

interface IconProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5", 
  lg: "h-6 w-6",
  xl: "h-8 w-8"
};

export function Icon({ size = "md", className, children }: IconProps) {
  return (
    <span className={cn(iconSizes[size], className)}>
      {children}
    </span>
  );
}