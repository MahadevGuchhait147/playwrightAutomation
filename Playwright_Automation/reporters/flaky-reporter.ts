import fs from 'node:fs';
import path from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type TestOutcome = 'passed' | 'failed' | 'flaky' | 'skipped';

type TestHistoryEntry = {
  title: string;
  file: string;
  project: string;
  totalRuns: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  lastStatus: TestOutcome;
  lastRunAt: string;
  flakyRate: number;
  recent: Array<{
    status: TestOutcome;
    runAt: string;
  }>;
};

type FlakyHistory = {
  updatedAt: string | null;
  totalRuns: number;
  tests: Record<string, TestHistoryEntry>;
};

type FlakyReporterOptions = {
  historyFile?: string;
  htmlFile?: string;
  maxRecent?: number;
};

const DEFAULT_HISTORY_FILE = path.join('test-results', 'flaky-history.json');
const DEFAULT_HTML_FILE = path.join('flaky-report', 'index.html');
const DEFAULT_MAX_RECENT = 20;

function emptyHistory(): FlakyHistory {
  return {
    updatedAt: null,
    totalRuns: 0,
    tests: {}
  };
}

function testKey(test: TestCase): string {
  const project = test.parent.project()?.name ?? 'default';
  const file = path.relative(process.cwd(), test.location.file).replaceAll('\\', '/');
  const titles = test.titlePath().slice(2).filter(Boolean).join(' > ');
  return `${project} | ${file} | ${titles}`;
}

function toOutcome(test: TestCase): TestOutcome | null {
  const outcome = test.outcome();
  if (outcome === 'expected') return 'passed';
  if (outcome === 'unexpected') return 'failed';
  if (outcome === 'flaky') return 'flaky';
  if (outcome === 'skipped') return 'skipped';
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildHtml(history: FlakyHistory, flakyThisRun: TestHistoryEntry[]): string {
  const allTests = Object.values(history.tests).sort((a, b) => b.flakyRate - a.flakyRate);
  const flakyHistory = allTests.filter((t) => t.flaky > 0);

  const flakyThisRunRows =
    flakyThisRun.length === 0
      ? `<tr><td colspan="4">No flaky tests in this run.</td></tr>`
      : flakyThisRun
          .map(
            (t) => `<tr>
              <td>${escapeHtml(t.title)}</td>
              <td><code>${escapeHtml(t.file)}</code></td>
              <td><span class="badge flaky">${escapeHtml(t.lastStatus)}</span></td>
              <td>${escapeHtml(t.lastRunAt)}</td>
            </tr>`
          )
          .join('\n');

  const historyRows =
    allTests.length === 0
      ? `<tr><td colspan="8">No history yet.</td></tr>`
      : allTests
          .map((t) => {
            const rate = `${(t.flakyRate * 100).toFixed(1)}%`;
            const rateClass = t.flakyRate >= 0.3 ? 'high' : t.flakyRate > 0 ? 'med' : 'low';
            return `<tr>
              <td>${escapeHtml(t.title)}</td>
              <td><code>${escapeHtml(t.file)}</code></td>
              <td>${t.passed}</td>
              <td>${t.failed}</td>
              <td>${t.flaky}</td>
              <td>${t.totalRuns}</td>
              <td><span class="rate ${rateClass}">${rate}</span></td>
              <td><span class="badge ${escapeHtml(t.lastStatus)}">${escapeHtml(t.lastStatus)}</span></td>
            </tr>`;
          })
          .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Flaky Test Report</title>
  <style>
    :root {
      --bg: #f6f8fa;
      --card: #ffffff;
      --text: #1f2328;
      --muted: #656d76;
      --border: #d0d7de;
      --flaky: #9a6700;
      --failed: #cf222e;
      --passed: #1a7f37;
      --skipped: #656d76;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    main { max-width: 1100px; margin: 2rem auto; padding: 0 1rem 3rem; }
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    .sub { color: var(--muted); margin-bottom: 1.5rem; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
    }
    .card .label { color: var(--muted); font-size: 0.85rem; }
    .card .value { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
    section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.25rem;
      overflow-x: auto;
    }
    h2 { margin: 0 0 0.75rem; font-size: 1.15rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
    th, td { text-align: left; padding: 0.55rem 0.5rem; border-bottom: 1px solid var(--border); vertical-align: top; }
    th { color: var(--muted); font-weight: 600; font-size: 0.85rem; }
    code { font-size: 0.85rem; }
    .badge {
      display: inline-block;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.flaky { background: #fff8c5; color: var(--flaky); }
    .badge.failed { background: #ffebe9; color: var(--failed); }
    .badge.passed { background: #dafbe1; color: var(--passed); }
    .badge.skipped { background: #eaeef2; color: var(--skipped); }
    .rate.high { color: var(--failed); font-weight: 700; }
    .rate.med { color: var(--flaky); font-weight: 700; }
    .rate.low { color: var(--passed); }
    a { color: #0969da; }
  </style>
</head>
<body>
  <main>
    <h1>Flaky Test Report</h1>
    <p class="sub">Updated: ${escapeHtml(history.updatedAt ?? 'n/a')} · Tracked runs: ${history.totalRuns}</p>

    <div class="cards">
      <div class="card"><div class="label">Tracked runs</div><div class="value">${history.totalRuns}</div></div>
      <div class="card"><div class="label">Flaky this run</div><div class="value">${flakyThisRun.length}</div></div>
      <div class="card"><div class="label">Tests with flaky history</div><div class="value">${flakyHistory.length}</div></div>
      <div class="card"><div class="label">Tracked tests</div><div class="value">${allTests.length}</div></div>
    </div>

    <section>
      <h2>Flaky in this run</h2>
      <table>
        <thead>
          <tr><th>Test</th><th>File</th><th>Status</th><th>When</th></tr>
        </thead>
        <tbody>
          ${flakyThisRunRows}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Full history</h2>
      <table>
        <thead>
          <tr>
            <th>Test</th><th>File</th><th>Passed</th><th>Failed</th>
            <th>Flaky</th><th>Total</th><th>Flaky rate</th><th>Last</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>
    </section>

    <p class="sub">Also see <a href="../playwright-report/index.html">Playwright HTML report</a> and <code>test-results/flaky-history.json</code>.</p>
  </main>
</body>
</html>
`;
}

class FlakyReporter implements Reporter {
  private readonly historyFile: string;
  private readonly htmlFile: string;
  private readonly maxRecent: number;
  private history: FlakyHistory = emptyHistory();
  private readonly currentRun = new Map<string, TestCase>();

  constructor(options: FlakyReporterOptions = {}) {
    this.historyFile = path.resolve(process.cwd(), options.historyFile ?? DEFAULT_HISTORY_FILE);
    this.htmlFile = path.resolve(process.cwd(), options.htmlFile ?? DEFAULT_HTML_FILE);
    this.maxRecent = options.maxRecent ?? DEFAULT_MAX_RECENT;
    this.history = this.loadHistory();
  }

  onTestEnd(test: TestCase, _result: TestResult): void {
    this.currentRun.set(test.id, test);
  }

  async onEnd(_result: FullResult): Promise<void> {
    const runAt = new Date().toISOString();
    this.history.totalRuns += 1;
    this.history.updatedAt = runAt;

    const flakyThisRun: TestHistoryEntry[] = [];

    for (const test of this.currentRun.values()) {
      const status = toOutcome(test);
      if (!status) {
        continue;
      }

      const key = testKey(test);
      const existing = this.history.tests[key] ?? {
        title: test.title,
        file: path.relative(process.cwd(), test.location.file).replaceAll('\\', '/'),
        project: test.parent.project()?.name ?? 'default',
        totalRuns: 0,
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        lastStatus: status,
        lastRunAt: runAt,
        flakyRate: 0,
        recent: []
      };

      existing.totalRuns += 1;
      existing.lastStatus = status;
      existing.lastRunAt = runAt;
      existing[status] += 1;
      existing.recent.push({ status, runAt });
      if (existing.recent.length > this.maxRecent) {
        existing.recent = existing.recent.slice(-this.maxRecent);
      }
      existing.flakyRate =
        existing.totalRuns === 0 ? 0 : Number((existing.flaky / existing.totalRuns).toFixed(3));

      this.history.tests[key] = existing;

      if (status === 'flaky') {
        flakyThisRun.push(existing);
      }
    }

    this.saveHistory();
    this.saveHtml(flakyThisRun);
    this.printSummary(flakyThisRun.map((t) => `${t.file} › ${t.title}`));
  }

  private loadHistory(): FlakyHistory {
    try {
      if (!fs.existsSync(this.historyFile)) {
        return emptyHistory();
      }
      const raw = fs.readFileSync(this.historyFile, 'utf8');
      const parsed = JSON.parse(raw) as FlakyHistory;
      return {
        updatedAt: parsed.updatedAt ?? null,
        totalRuns: parsed.totalRuns ?? 0,
        tests: parsed.tests ?? {}
      };
    } catch {
      return emptyHistory();
    }
  }

  private saveHistory(): void {
    fs.mkdirSync(path.dirname(this.historyFile), { recursive: true });
    fs.writeFileSync(this.historyFile, `${JSON.stringify(this.history, null, 2)}\n`, 'utf8');
  }

  private saveHtml(flakyThisRun: TestHistoryEntry[]): void {
    fs.mkdirSync(path.dirname(this.htmlFile), { recursive: true });
    fs.writeFileSync(this.htmlFile, buildHtml(this.history, flakyThisRun), 'utf8');
  }

  private printSummary(flakyThisRun: string[]): void {
    console.log('\n========== Flaky Reporter ==========');
    console.log(`History file: ${this.historyFile}`);
    console.log(`HTML report:  ${this.htmlFile}`);
    console.log(`Total tracked runs: ${this.history.totalRuns}`);

    if (flakyThisRun.length === 0) {
      console.log('No flaky tests in this run.');
    } else {
      console.log(`Flaky tests in this run (${flakyThisRun.length}):`);
      for (const name of flakyThisRun) {
        console.log(`  - ${name}`);
      }
    }

    const chronic = Object.values(this.history.tests)
      .filter((entry) => entry.flaky > 0)
      .sort((a, b) => b.flakyRate - a.flakyRate)
      .slice(0, 10);

    if (chronic.length > 0) {
      console.log('Top flaky tests (history):');
      for (const entry of chronic) {
        console.log(
          `  - ${entry.file} › ${entry.title} | flaky ${entry.flaky}/${entry.totalRuns} (${(entry.flakyRate * 100).toFixed(1)}%)`
        );
      }
    }

    console.log('====================================\n');
  }
}

export default FlakyReporter;
