// A simple horizontal bar chart made from plain HTML and CSS (no chart library).
// data looks like: [{ label: "Open", value: 5 }, { label: "Resolved", value: 3 }]
export default function BarChart({ title, subtitle, data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="panel chart-panel">
      <h2 className="panel-title">{title}</h2>
      {subtitle && <p className="chart-subtitle">{subtitle}</p>}

      <ul className="bars">
        {data.map((d) => {
          const percent = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li
              key={d.label}
              className="bar-row"
              title={
                d.label +
                ": " +
                d.value +
                (d.value === 1 ? " ticket" : " tickets") +
                " (" +
                percent +
                "%)"
              }
            >
              <span className="bar-label">{d.label}</span>
              <span className="bar-track" aria-hidden="true">
                <span
                  className="bar-fill"
                  style={{ width: (d.value / max) * 100 + "%" }}
                />
              </span>
              <span className="bar-value">{d.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}