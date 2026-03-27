const NAV_ITEMS = [
  'Dashboard',
  'Workspace',
  'Tasks',
  'Runs',
  'Events',
  'Control Plane',
  'Health',
] as const

export function Navigation() {
  return (
    <nav aria-label="FoxPilot 主导航">
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </nav>
  )
}
