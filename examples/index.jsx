import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// const render = Component => {
//   ReactDOM.render(
//     <AppContainer>
//       <Component />
//     </AppContainer>,
//     document.getElementById('app'),
//   )
// }

// render(App)

ReactDOM
  .createRoot(document.getElementById('app'))
  .render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )

// Webpack Hot Module Replacement API
// if (module.hot) {
//   module.hot.accept('./App', () => { render(App) })
// }
