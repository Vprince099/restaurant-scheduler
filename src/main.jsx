// existing React/Vite bootstrapping...

// PWA registration (vite-plugin-pwa injects the file at build time)
if ('serviceWorker' in navigator) {
  // optional: listens for updates and reloads automatically
  window.addEventListener('load', () => {
    navigator.serviceWorker.ready.then(reg => {
      // You can handle update prompts here if you want
    })
  })
}
