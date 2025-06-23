/**
 * TDD REFACTOR: Extract Clerk theme configuration for reusability
 * 
 * This refactor centralizes styling and makes it easier to maintain
 * consistent theming across auth components.
 */

// Use any type for Clerk Appearance to avoid import issues
export const clerkDarkTheme: any = {
  elements: {
    formButtonPrimary: 
      'bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-sm normal-case',
    card: 'bg-gray-900 border-gray-800 shadow-xl',
    headerTitle: 'text-white text-2xl',
    headerSubtitle: 'text-gray-400',
    formFieldLabel: 'text-white',
    formFieldInput: 
      'bg-gray-800 border-gray-700 text-gray-50 placeholder:text-gray-400 focus:border-emerald-500 focus-visible:ring-emerald-500',
    footerActionLink: 'text-emerald-500 hover:text-emerald-400',
    dividerText: 'text-gray-400',
    socialButtonsIconButton: 
      'border-gray-700 hover:bg-gray-800',
    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-200',
    // Mobile-specific optimizations
    formFieldRow: 'space-y-2',
    formFieldAction: 'mt-2',
  },
  layout: {
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'iconButton',
  },
}