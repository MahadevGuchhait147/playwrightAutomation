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
  maxRecent?: number;
};

const DEFAULT_HISTORY_FILE = path.join('test-results', 'flaky-history.json');
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
  // titlePath() starts with project + file; keep only describe/test titles
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

class FlakyReporter implements Reporter {
  private readonly historyFile: string;
  private readonly maxRecent: number;
  private history: FlakyHistory = emptyHistory();
  private readonly currentRun = new Map<string, TestCase>();

  constructor(options: FlakyReporterOptions = {}) {
    this.historyFile = path.resolve(process.cwd(), options.historyFile ?? DEFAULT_HISTORY_FILE);
    this.maxRecent = options.maxRecent ?? DEFAULT_MAX_RECENT;
    this.history = this.loadHistory();
  }

  onTestEnd(test: TestCase, _result: TestResult): void {
    // Track final attempt only once per test (retries share the same TestCase).
    this.currentRun.set(test.id, test);
  }

  async onEnd(_result: FullResult): Promise<void> {
    const runAt = new Date().toISOString();
    this.history.totalRuns += 1;
    this.history.updatedAt = runAt;

    const flakyThisRun: string[] = [];

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
        flakyThisRun.push(`${existing.file} › ${existing.title}`);
      }
    }

    this.saveHistory();
    this.printSummary(flakyThisRun);
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

  private printSummary(flakyThisRun: string[]): void {
    console.log('\n========== Flaky Reporter ==========');
    console.log(`History file: ${this.historyFile}`);
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
