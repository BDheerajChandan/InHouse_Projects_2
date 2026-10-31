export default function Breadcrumbs({ crumbs, onNavigate }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          {crumbs.length ? (
            <button type="button" onClick={() => onNavigate('')}>Home</button>
          ) : (
            <span aria-current="page">Home</span>
          )}
        </li>
        {crumbs.map((c, i) => (
          <li key={c.path}>
            <span aria-hidden="true">&gt;</span>
            {i === crumbs.length - 1 ? (
              <span aria-current="page">{c.label}</span>
            ) : (
              <button type="button" onClick={() => onNavigate(c.path)}>{c.label}</button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}