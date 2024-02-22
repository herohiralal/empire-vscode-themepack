import { writeFile } from 'fs'
import { promisify } from 'util'
import chroma from 'chroma-js'
// Oh Lucy
import theme from './empire-theme.mjs'
import colors from './empire-color.mjs'

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

const promisifiedWriteFile = promisify(writeFile);

const calculate_dark_theme = (color) => {
  const [hue, saturation, value] = chroma(color).hsv();
  const alpha = chroma(color).alpha();

  const clamp = (number) => Math.min(Math.max(number, 0), 1);

  const newHue = clamp((hue / 360.0) * 1) * 360.0;
  const newValue = clamp(value < 0.6 ? (value * 1.75) : (value < 0.8 ? (value * 1.1) : value));
  const newSaturation = clamp(newValue < 0.5 ? 0 : (saturation < 0.4 ? saturation : (saturation + 0.1)));

  return chroma.hsv(newHue, newSaturation, newValue, alpha).hex();
}

const calculate_light_theme = (color) => {
  const [hue, saturation, value] = chroma(color).hsv();
  const alpha = chroma(color).alpha();

  const clamp = (number) => Math.min(Math.max(number, 0), 1);

  const newHue = clamp((hue / 360.0) * 1) * 360.0;
  const newValue = clamp(value < 0.4 ? ((1 - value) * 0.95) : (value * 0.6));
  const newSaturation = clamp(value < 0.4 ? 0 : (saturation + 0.55));

  return chroma.hsv(newHue, newSaturation, newValue, alpha).hex();
}

const VARIANTS = {
  'empire-moonlit-castle': {
    theme: theme,
    colors: colors,
    type: 'dark',
    getColor: (color) => calculate_dark_theme(color),
  },
  'empire-thousand-suns': {
    theme: theme,
    colors: colors,
    type: 'light',
    getColor: (color) => calculate_light_theme(color),
  },
};

const buildTheme = async (variants) => {
  try {
    await Promise.all(
      // For each theme variant
      Object.entries(variants).map(([variantName, variant]) => {
        // Assemble the theme's JSON
        const themeWithColors = variant.theme({
          'name': variantName,
          'colors': Object.entries(variant.colors).reduce(
            (acc, [colorName, colorValue]) => ({
              ...acc,
              [colorName]: variant.getColor(colorValue)
            }),
            {}
          ),
          'type': variant.type,
        });

        // Export it to a file
        return promisifiedWriteFile(
          `./temp/${variantName}-color-theme.json`,
          JSON.stringify(themeWithColors, null, 4)
        );
      })
    );
    console.log('🌺 Theme built. 💅');
  } catch (error) {
    console.log(error);
  }
};

buildTheme(VARIANTS)