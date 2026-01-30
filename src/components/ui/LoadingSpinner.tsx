import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function LoadingSpinner({ className, size = 24, ...props }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex justify-center items-center text-primary", className)} {...props}>
      <Loader2 className="animate-spin" size={size} />
    </div>
  );
}
