/**
 * vite 的 CSS 导入没有类型声明 —— main.ts 里 `import './style.css'` 是 vite 的写法，
 * tsc 按 moduleResolution 去找它的类型时找不到，就会报
 *   TS2882: Cannot find module or type declarations for side-effect import of './style.css'
 * （这条检查是较新的 TypeScript 才有的，5.4.5 不会报。）
 *
 * 标准做法是 `/// <reference types="vite/client" />`，它依赖 vite 已安装；
 * 这里改成自己声明，不依赖任何包，装没装依赖都能过。
 */
declare module '*.css';
