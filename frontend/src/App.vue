<template>
  <div id="poker-app">
    <router-view />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #06060a;
  color: #e8e0f0;
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

#poker-app {
  min-height: 100vh;
}

::selection {
  background: rgba(212, 175, 55, 0.3);
  color: #f5e6a3;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.3); }

.landing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.landing h1 {
  font-size: 3rem;
  background: linear-gradient(135deg, #d4af37, #f5e6a3, #d4af37);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.landing p {
  color: #5a5a7a;
  font-size: 1.1rem;
}
</style>
