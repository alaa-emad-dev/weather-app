// Hand-made SVG line chart for the next 24 hours (no chart library).
export function hourlyChart(hours) {
  const W = 760, H = 200, padX = 28, top = 34, bottom = 40;
  const temps = hours.map((h) => h.temp);
  const min = Math.min(...temps), max = Math.max(...temps);
  const range = max - min || 1;
  const x = (i) => padX + (i * (W - padX * 2)) / (hours.length - 1);
  const y = (t) => top + (1 - (t - min) / range) * (H - top - bottom);

  // Smooth curve through the points (simple midpoint bezier).
  let d = `M ${x(0)} ${y(temps[0])}`;
  for (let i = 1; i < hours.length; i++) {
    const cx = (x(i - 1) + x(i)) / 2;
    d += ` C ${cx} ${y(temps[i - 1])}, ${cx} ${y(temps[i])}, ${x(i)} ${y(temps[i])}`;
  }
  const area = `${d} L ${x(hours.length - 1)} ${H - bottom + 6} L ${x(0)} ${H - bottom + 6} Z`;

  const dots = hours.map((h, i) => {
    const showLabel = i % 3 === 0;
    return `
      <circle cx="${x(i)}" cy="${y(h.temp)}" r="${showLabel ? 4 : 2.5}" fill="#fff"/>
      ${showLabel ? `<text x="${x(i)}" y="${y(h.temp) - 12}" text-anchor="middle" class="c-temp">${Math.round(h.temp)}°</text>
      <text x="${x(i)}" y="${H - 18}" text-anchor="middle" class="c-hour">${h.label}</text>
      <text x="${x(i)}" y="${H - 4}" text-anchor="middle" class="c-rain">${h.rain}%</text>` : ""}`;
  }).join("");

  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Temperature for the next 24 hours">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#area)"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      ${dots}
    </svg>`;
}
