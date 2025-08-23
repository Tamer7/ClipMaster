import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import App from './App'

// Make body transparent for rounded corners
document.body.style.backgroundColor = 'transparent'
document.body.style.margin = '0'
document.body.style.padding = '0'

// Add custom scrollbar styles
const style = document.createElement('style')
style.textContent = `
  ::-webkit-scrollbar {
    width: 4px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: var(--mantine-color-dark-4);
    border-radius: 2px;
    min-height: 30px;  /* Even shorter thumb */
    max-height: 30px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: var(--mantine-color-dark-3);
  }

  /* Hide scrollbar when not hovering */
  ::-webkit-scrollbar-thumb {
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  *:hover::-webkit-scrollbar-thumb {
    opacity: 1;
  }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      defaultColorScheme="light"
      theme={{
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        headings: { fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif' }
      }}
    >
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>
)
