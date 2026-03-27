import { Navigation } from '@/ui/app/navigation.js'

export function AppLayout() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 320px',
        minHeight: '100vh',
        background: '#0b1020',
        color: '#e7ecf3',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid #1e293b',
          padding: '24px 16px',
        }}
      >
        <Navigation />
      </aside>
      <main
        style={{
          padding: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>FoxPilot Desktop</h1>
      </main>
      <section
        data-testid="context-panel"
        style={{
          borderLeft: '1px solid #1e293b',
          padding: '24px 16px',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: '1rem' }}>上下文面板</h2>
      </section>
    </div>
  )
}
