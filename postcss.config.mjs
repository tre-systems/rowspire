import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: process.env.VITEST ? [] : [tailwindcss()],
};
