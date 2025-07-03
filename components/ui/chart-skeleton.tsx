"use client";

export function ChartSkeleton() {
  return (
    <div className="h-full w-full">
      {/* Chart container matching the actual chart layout */}
      <div className="relative h-full w-full p-4">
        {/* Y-axis area */}

        <div className="w-full h-[300px] p-4 border rounded-lg bg-card">
          {/* Chart Area Only */}
          <div className="w-full h-full relative">
            {/* Area Chart Skeleton */}
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="skeleton-gradient-1"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--muted))"
                    stopOpacity="0.8"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--muted))"
                    stopOpacity="0.1"
                  />
                </linearGradient>
              </defs>
              <path
                d="M0,80 Q25,60 50,70 T100,50 L100,100 L0,100 Z"
                fill="url(#skeleton-gradient-1)"
                className="animate-pulse"
              />
              <path
                d="M0,80 Q25,60 50,70 T100,50"
                stroke="hsl(var(--muted))"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            {/* Secondary area */}
            <svg
              className="w-full h-full absolute inset-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="skeleton-gradient-2"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--muted-foreground))"
                    stopOpacity="0.4"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--muted-foreground))"
                    stopOpacity="0.05"
                  />
                </linearGradient>
              </defs>
              <path
                d="M0,90 Q25,75 50,85 T100,70 L100,100 L0,100 Z"
                fill="url(#skeleton-gradient-2)"
                className="animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <path
                d="M0,90 Q25,75 50,85 T100,70"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
