/**
 * Adaptive Clerk theme configuration that responds to the global theme
 *
 * This provides theme configurations that match the app's light/dark mode
 */

// Light theme configuration
export const clerkLightTheme: Record<string, unknown> = {
  elements: {
    formButtonPrimary:
      "bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-sm normal-case",
    card: "bg-background border-border shadow-xl",
    headerTitle: "text-foreground text-2xl",
    headerSubtitle: "text-muted-foreground",
    formFieldLabel: "text-foreground",
    formFieldInput:
      "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus-visible:ring-emerald-500",
    footerActionLink: "text-emerald-600 hover:text-emerald-700",
    dividerText: "text-muted-foreground",
    socialButtonsIconButton: "border-border hover:bg-muted",
    formFieldInputShowPasswordButton:
      "text-muted-foreground hover:text-foreground",
    // Mobile-specific optimizations
    formFieldRow: "space-y-2",
    formFieldAction: "mt-2",
  },
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton",
  },
};

// Dark theme configuration (updated from the existing one)
export const clerkDarkTheme: Record<string, unknown> = {
  elements: {
    formButtonPrimary:
      "bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-sm normal-case",
    card: "bg-background border-border shadow-xl",
    headerTitle: "text-foreground text-2xl",
    headerSubtitle: "text-muted-foreground",
    formFieldLabel: "text-foreground",
    formFieldInput:
      "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus-visible:ring-emerald-500",
    footerActionLink: "text-emerald-500 hover:text-emerald-400",
    dividerText: "text-muted-foreground",
    socialButtonsIconButton: "border-border hover:bg-muted",
    formFieldInputShowPasswordButton:
      "text-muted-foreground hover:text-foreground",
    // Mobile-specific optimizations
    formFieldRow: "space-y-2",
    formFieldAction: "mt-2",
  },
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton",
  },
};

// System theme that uses CSS variables
export const clerkSystemTheme: Record<string, unknown> = {
  elements: {
    formButtonPrimary:
      "bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-sm normal-case",
    card: "bg-background border-border shadow-xl",
    headerTitle: "text-foreground text-2xl",
    headerSubtitle: "text-muted-foreground",
    formFieldLabel: "text-foreground",
    formFieldInput:
      "bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus-visible:ring-emerald-500",
    footerActionLink: "text-emerald-500 hover:text-emerald-400",
    dividerText: "text-muted-foreground",
    socialButtonsIconButton: "border-border hover:bg-muted",
    formFieldInputShowPasswordButton:
      "text-muted-foreground hover:text-foreground",
    // Mobile-specific optimizations
    formFieldRow: "space-y-2",
    formFieldAction: "mt-2",
    // Override to ensure proper theming
    rootBox: "clerk-theme-adaptive",
  },
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "iconButton",
  },
};
