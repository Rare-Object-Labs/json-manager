import './App.css'

function App() {
  return (
    <main className="starter-screen">
      <section className="starter-card" aria-labelledby="app-name">
        <p className="status">Project created successfully</p>
        <h1 id="app-name">{'{{DISPLAY_NAME}}'}</h1>
        <p className="description">{'{{DESCRIPTION}}'}</p>
        <p className="domain">{'{{POC_DOMAIN}}'}</p>
      </section>
    </main>
  )
}

export default App
