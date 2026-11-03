import { AppRouter } from './router/AppRouter'
import { QueryProvider } from './providers/QueryProvider'

function App() {
  return <QueryProvider><AppRouter /></QueryProvider>
}

export default App
