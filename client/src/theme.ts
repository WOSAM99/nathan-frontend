import {
  buttonClasses,
  checkboxClasses,
  createTheme,
  PaletteColor,
  PaletteColorOptions,
  CommonColors,
} from "@mui/material";

/**
 * theme.ts
 *
 * This file provides the theme configuration for the Material-UI (MUI) application,
 * defining custom colors, typography, and component styles. It extends the default
 * MUI theme with custom properties and overrides to maintain consistent styling
 * across the application.
 *
 * @module theme
 */


export const fontFamilyInter = "'Inter', sans-serif";


/**
 * Theme
 *
 * Main theme configuration object.
 * Defines the complete theme structure including colors, typography, and component styles.
 *
 * @constant {Theme}
 */
export const theme = createTheme({
  typography: {
    fontFamily: fontFamilyInter,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: fontFamilyInter,
        },
      },
    },
  },
});
