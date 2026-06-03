/// <reference types="vite/client" />

// vite-imagetools: imports ending with &as=srcset return an HTML srcset string
declare module '*&as=srcset' {
  const srcset: string
  export default srcset
}
