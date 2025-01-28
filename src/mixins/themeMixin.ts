// src/mixins/themeMixin.ts
import { computed } from 'vue';
import { useTheme } from 'vuetify';

export const useThemeMixin = () => {
  const theme = useTheme();

  // Computed to know if the current theme is dark
  const isDarkTheme = computed(() => theme.global.current.value.dark);

  const toggleTheme = () => {
    // Toggle between light and dark themes
    theme.global.name.value = isDarkTheme.value ? 'light' : 'dark';
  };

  return { theme, toggleTheme, isDarkTheme };
};
