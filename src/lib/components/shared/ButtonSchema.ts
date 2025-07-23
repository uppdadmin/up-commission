// Button variant types
export type ButtonVariant = 
  | 'create' 
  | 'refresh' 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'warning' 
  | 'success'
  | 'info'
  | 'authorize'
  | 'revoke'
  | 'delete';

export type ButtonSize = 'sm' | 'md' | 'lg';

// Base button styles
const baseButtonStyles = "group flex items-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 shadow-md border-b-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-0";

// Size configurations
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm sm:text-base",
  lg: "px-6 py-3 text-base sm:text-lg"
};

// Variant configurations
const variantStyles: Record<ButtonVariant, string> = {
  create: "bg-[#48bb70] text-white border-green-800 hover:bg-green-700 active:bg-green-800 focus-visible:outline-green-500",
  refresh: "bg-[#55a6e0] text-white border-blue-800 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-500",
  primary: "bg-green-600 text-white border-blue-800 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-500",
  secondary: "bg-[#4b5563] text-white border-gray-800 hover:bg-gray-700 active:bg-gray-800 focus-visible:outline-gray-500",
  danger: "bg-[#f56561] text-white border-red-800 hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-500",
  warning: "bg-[#ecc94b] text-white border-yellow-800 hover:bg-yellow-700 active:bg-yellow-800 focus-visible:outline-yellow-500",
  success: "bg-[#48bb70] text-white border-emerald-800 hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-emerald-500",
  info: "bg-[#38b2ac] text-white border-cyan-800 hover:bg-cyan-700 active:bg-cyan-800 focus-visible:outline-cyan-500",
  authorize: "bg-[#48bb70] text-white border-green-800 hover:bg-green-700 active:bg-green-800 focus-visible:outline-green-500",
  revoke: "bg-[#edb284] text-white border-orange-800 hover:bg-orange-700 active:bg-orange-800 focus-visible:outline-orange-500",
  delete: "bg-[#f56561] text-white border-red-800 hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-500"
};

// Main function to get button styles
export const getButtonStyles = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth: boolean = false
): string => {
  const widthClass = fullWidth ? 'w-full justify-center' : '';
  return `${baseButtonStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthClass}`.trim();
};

// Small button variant for admin actions
export const getSmallButtonStyles = (
  variant: ButtonVariant = 'primary',
  fullWidth: boolean = false
): string => {
  const baseStyles = "group flex items-center justify-center gap-1 px-3 py-1 rounded-lg font-semibold text-xs transition-all duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 border-b-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-0";
  const widthClass = fullWidth ? 'w-full justify-center' : '';
  return `${baseStyles} ${variantStyles[variant]} ${widthClass}`.trim();
};

// ...existing code...

// Predefined common button combinations
export const buttonPresets = {
  createService: () => getButtonStyles('create', 'md'),
  refreshData: () => getButtonStyles('refresh', 'md'),
  submitForm: () => getButtonStyles('primary', 'md'),
  cancelAction: () => getButtonStyles('secondary', 'md'),
  deleteItem: () => getButtonStyles('danger', 'md'),
  mobileFullWidth: (variant: ButtonVariant) => getButtonStyles(variant, 'md', true),
  // Admin action presets
  authorizeService: () => getSmallButtonStyles('authorize'),
  revokeService: () => getSmallButtonStyles('revoke'),
  deleteService: () => getSmallButtonStyles('delete')
} as const;

// ...existing code...