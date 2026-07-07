function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function scoreColor(score) {
  if (score >= 80) return '#16A34A';
  if (score >= 50) return '#D97706';
  return '#DC2626';
}

function severityColor(sev) {
  return { high: '#DC2626', medium: '#D97706', low: '#6B7280' }[sev] || '#6B7280';
}

export function renderReportHtml({ business, report }) {
  const categoriesHtml = report.categories
    .map(
      (cat) => `
    <section class="category">
      <div class="category-header">
        <h2>${escapeHtml(cat.name)}</h2>
        <span class="score" style="color:${scoreColor(cat.score)}">${cat.score}/100</span>
      </div>
      <ul class="findings">
        ${cat.findings
          .map(
            (f) => `
          <li>
            <span class="severity" style="background:${severityColor(f.severity)}">${escapeHtml(f.severity)}</span>
            <div>
              <p class="issue">${escapeHtml(f.issue)}</p>
              <p class="recommendation">${escapeHtml(f.recommendation)}</p>
            </div>
          </li>`
          )
          .join('')}
      </ul>
    </section>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SEO Audit -- ${escapeHtml(business.name)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 20px; color: #1F2937; background: #F9FAFB; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  .subtitle { color: #6B7280; margin-bottom: 24px; }
  .overall { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .overall-score { font-size: 48px; font-weight: 700; }
  .category { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .category-header { display: flex; justify-content: space-between; align-items: center; }
  .category-header h2 { font-size: 18px; margin: 0; }
  .score { font-size: 20px; font-weight: 700; }
  .findings { list-style: none; padding: 0; margin: 16px 0 0; }
  .findings li { display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid #F3F4F6; }
  .severity { color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; height: fit-content; white-space: nowrap; }
  .issue { font-weight: 600; margin: 0 0 4px; }
  .recommendation { color: #4B5563; margin: 0; font-size: 14px; }
  .list-section { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .list-section h2 { font-size: 18px; }
  .list-section ul { margin: 8px 0 0; padding-left: 20px; }
  .list-section li { margin-bottom: 6px; }
  footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 32px; }
</style>
</head>
<body>
  <h1>SEO Audit Report</h1>
  <p class="subtitle">${escapeHtml(business.name)} &middot; ${escapeHtml(business.url)}${business.location ? ` &middot; ${escapeHtml(business.location)}` : ''}</p>

  <div class="overall">
    <div class="overall-score" style="color:${scoreColor(report.overallScore)}">${report.overallScore}/100</div>
    <p>${escapeHtml(report.executiveSummary)}</p>
  </div>

  ${categoriesHtml}

  <div class="list-section">
    <h2>Quick Wins</h2>
    <ul>${report.quickWins.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ul>
  </div>

  <div class="list-section">
    <h2>Priority Actions</h2>
    <ul>${report.priorityActions.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
  </div>

  <footer>Generated for ${escapeHtml(business.name)} &middot; ${new Date().toISOString().slice(0, 10)}</footer>
</body>
</html>`;
}
