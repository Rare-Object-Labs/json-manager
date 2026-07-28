import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="{{DISPLAY_NAME}} home">
          {'{{DISPLAY_NAME}}'}
        </a>
        <nav aria-label="Primary navigation">
          <a href="#overview">Overview</a>
          <a href="#next-steps">Next steps</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="overview">
          <p className="eyebrow">React application starter</p>
          <h1>{'{{DISPLAY_NAME}}'}</h1>
          <p className="summary">{'{{DESCRIPTION}}'}</p>
        </section>

        <section className="content-card" id="next-steps">
          <h2>Ready for your application</h2>
          <p>
            Replace this neutral shell with product-specific routes, components,
            and styles as requirements become clear.
          </p>
        </section>
      </main>

      <footer>
        <p>{'{{DISPLAY_NAME}}'} starter template</p>
      </footer>
    </div>
  )
}

export default App
