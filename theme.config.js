/** @type {const} */
const themeColors = {
  primary: { light: '#DC2626', dark: '#DC2626' }, // Panic red
  background: { light: '#ffffff', dark: '#151718' },
  surface: { light: '#F9FAFB', dark: '#1E2022' },
  foreground: { light: '#111827', dark: '#F9FAFB' },
  muted: { light: '#6B7280', dark: '#9BA1A6' },
  border: { light: '#E5E7EB', dark: '#374151' },
  success: { light: '#16A34A', dark: '#4ADE80' },
  warning: { light: '#EAB308', dark: '#FBBF24' },
  error: { light: '#DC2626', dark: '#F87171' },
  danger: { light: '#991B1B', dark: '#991B1B' }, // Dark red for active panic state
};

module.exports = { themeColors };
