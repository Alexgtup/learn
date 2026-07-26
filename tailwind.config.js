/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ← обязательно должны быть tsx и все папки
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}