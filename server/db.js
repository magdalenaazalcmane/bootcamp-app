import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'data.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    preconditions TEXT,
    steps TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Trivial')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'passed', 'failed', 'skipped')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    feature TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'in-progress', 'passed', 'failed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suite_test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    UNIQUE (suite_id, test_case_id)
  );

  CREATE TABLE IF NOT EXISTS bugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    steps_to_reproduce TEXT NOT NULL,
    expected TEXT NOT NULL,
    actual TEXT NOT NULL,
    environment TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Trivial')),
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL CHECK (status IN ('open', 'in-progress', 'resolved', 'closed', 'reopened')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bug_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bug_id INTEGER NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('status_change', 'comment')),
    old_value TEXT,
    new_value TEXT,
    message TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_runs_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('in-progress', 'completed')),
    pass_count INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0,
    skip_count INTEGER NOT NULL DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS test_run_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL REFERENCES test_runs_v2(id) ON DELETE CASCADE,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    result TEXT CHECK (result IS NULL OR result IN ('passed', 'failed', 'skipped')),
    duration_ms INTEGER,
    notes TEXT,
    failed_at TEXT,
    alert_sent_at TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER REFERENCES test_runs_v2(id) ON DELETE SET NULL,
    suite_name TEXT NOT NULL,
    run_date TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    passed_count INTEGER NOT NULL,
    failed_count INTEGER NOT NULL,
    skipped_count INTEGER NOT NULL,
    results TEXT NOT NULL,
    generated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT NOT NULL CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
    default_severity_for_new_bugs TEXT NOT NULL CHECK (default_severity_for_new_bugs IN ('Critical', 'Major', 'Minor', 'Trivial')) DEFAULT 'Minor',
    default_page_size INTEGER NOT NULL CHECK (default_page_size IN (10, 20, 50, 100)) DEFAULT 20,
    timezone TEXT,
    auto_generate_report_after_run INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );
`);

const seedCount = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get().count;

if (seedCount === 0) {
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO test_cases (title, preconditions, steps, expected_result, severity, status, created_at, updated_at)
    VALUES (@title, @preconditions, @steps, @expected_result, @severity, @status, @created_at, @updated_at)
  `);

  const seedData = [
    {
      title: 'User can log in with valid credentials [Login]',
      preconditions: 'A registered user account exists with a known username and password, and the user is logged out, viewing the login page.',
      steps: JSON.stringify([
        'Navigate to the login page.',
        'Enter the registered username in the username field.',
        'Enter the correct password in the password field.',
        'Click the "Log in" button.',
      ]),
      expected_result: 'The user is authenticated and redirected to their dashboard/home page, with no error messages shown.',
      severity: 'Critical',
      status: 'ready',
    },
    {
      title: 'Login is rejected with an incorrect password [Login]',
      preconditions: 'A registered user account exists, and the user is logged out, viewing the login page.',
      steps: JSON.stringify([
        'Navigate to the login page.',
        'Enter the registered username in the username field.',
        'Enter an incorrect password in the password field.',
        'Click the "Log in" button.',
      ]),
      expected_result: 'The login is rejected, an error message is shown, and the user remains on the login page.',
      severity: 'Major',
      status: 'passed',
    },
    {
      title: 'Search results update as the user types [Search]',
      preconditions: 'The user is on a page with a search input and at least one matching record exists.',
      steps: JSON.stringify([
        'Navigate to the page with the search input.',
        'Type a partial match for an existing record into the search field.',
      ]),
      expected_result: 'The results list filters to show only records matching the typed text, without requiring a page reload.',
      severity: 'Minor',
      status: 'draft',
    },
    {
      title: 'Deleting a record asks for confirmation [Test Cases]',
      preconditions: 'At least one test case exists in the list.',
      steps: JSON.stringify([
        'Open the test case list.',
        'Click the delete action on a row.',
      ]),
      expected_result: 'A confirmation prompt appears before the record is deleted; the record is only removed after confirming.',
      severity: 'Major',
      status: 'failed',
    },
    {
      title: 'Footer copyright year is up to date [UI]',
      preconditions: 'None.',
      steps: JSON.stringify([
        'Load any page of the app.',
        'Scroll to the footer.',
      ]),
      expected_result: 'The footer shows the current year.',
      severity: 'Trivial',
      status: 'skipped',
    },
  ];

  for (const row of seedData) {
    insert.run({ ...row, created_at: now, updated_at: now });
  }
}

const suiteSeedCount = db.prepare('SELECT COUNT(*) AS count FROM suites').get().count;

if (suiteSeedCount === 0) {
  const now = new Date().toISOString();
  const insertSuite = db.prepare(`
    INSERT INTO suites (name, feature, status, created_at, updated_at)
    VALUES (@name, @feature, @status, @created_at, @updated_at)
  `);
  const insertCase = db.prepare(`
    INSERT INTO suite_test_cases (suite_id, test_case_id, sort_order)
    VALUES (@suite_id, @test_case_id, @sort_order)
  `);
  const allCaseIds = db.prepare('SELECT id FROM test_cases ORDER BY id').all().map((r) => r.id);

  const suiteSeedData = [
    {
      name: 'Login regression suite',
      feature: 'login',
      status: 'ready',
      caseIds: allCaseIds.slice(0, 3),
    },
    {
      name: 'Release smoke suite',
      feature: 'smoke',
      status: 'draft',
      caseIds: allCaseIds.slice(2, 5),
    },
  ];

  for (const suite of suiteSeedData) {
    const result = insertSuite.run({
      name: suite.name,
      feature: suite.feature,
      status: suite.status,
      created_at: now,
      updated_at: now,
    });
    suite.caseIds.forEach((testCaseId, index) => {
      insertCase.run({ suite_id: result.lastInsertRowid, test_case_id: testCaseId, sort_order: index });
    });
  }
}

const bugSeedCount = db.prepare('SELECT COUNT(*) AS count FROM bugs').get().count;

if (bugSeedCount === 0) {
  const now = new Date().toISOString();
  const insertBug = db.prepare(`
    INSERT INTO bugs (title, description, steps_to_reproduce, expected, actual, environment, severity, priority, status, created_at, updated_at)
    VALUES (@title, @description, @steps_to_reproduce, @expected, @actual, @environment, @severity, @priority, @status, @created_at, @updated_at)
  `);
  const insertActivity = db.prepare(`
    INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, timestamp)
    VALUES (@bug_id, @action, @old_value, @new_value, @message, @timestamp)
  `);

  const bugSeedData = [
    {
      title: 'Login button unresponsive on mobile Safari',
      description: 'Tapping the "Log in" button on iOS Safari does nothing the first time; it only works on a second tap.',
      steps_to_reproduce: JSON.stringify([
        'Open the app in Safari on an iPhone.',
        'Navigate to the login page.',
        'Enter valid credentials.',
        'Tap the "Log in" button once.',
      ]),
      expected: 'The form submits immediately and the user is logged in.',
      actual: 'Nothing happens on the first tap; a second tap is required to submit the form.',
      environment: 'iOS 17.4, Safari, iPhone 14',
      severity: 'Major',
      priority: 'High',
      status: 'open',
      activity: [],
    },
    {
      title: 'Search results flash empty state before loading',
      description: 'The "No test cases found" message briefly appears before results load in, causing a visible flicker.',
      steps_to_reproduce: JSON.stringify([
        'Go to the test cases page.',
        'Type a search term that has matching results.',
      ]),
      expected: 'The list shows a loading state, then the matching results, with no empty-state flash.',
      actual: 'The "No test cases found" message flashes for a moment before the real results appear.',
      environment: 'Chrome 128, macOS',
      severity: 'Minor',
      priority: 'Medium',
      status: 'in-progress',
      activity: [
        {
          action: 'status_change',
          old_value: 'open',
          new_value: 'in-progress',
          message: 'Reproduced locally — looks like a race condition in the search debounce logic.',
        },
      ],
    },
    {
      title: 'App crashes when deleting the last test case on a page',
      description: 'Deleting the only remaining test case on a non-first page leaves the list in a broken state.',
      steps_to_reproduce: JSON.stringify([
        'Have more than 20 test cases so a second page exists.',
        'Navigate to the last page, which has exactly one test case.',
        'Delete that test case.',
      ]),
      expected: 'The user is returned to a valid page showing the remaining test cases.',
      actual: 'The page stays on the now-empty last page and shows "No test cases found" with no way back without manually clicking Previous.',
      environment: 'Chrome 128, macOS',
      severity: 'Critical',
      priority: 'Urgent',
      status: 'resolved',
      activity: [
        {
          action: 'status_change',
          old_value: 'open',
          new_value: 'in-progress',
          message: 'Confirmed — pagination state is not adjusted after a delete shrinks the total page count.',
        },
        {
          action: 'status_change',
          old_value: 'in-progress',
          new_value: 'resolved',
          message: 'Fixed by clamping the current page after a delete reduces the total; verified locally.',
        },
      ],
    },
  ];

  bugSeedData.forEach((bug, bugIndex) => {
    const createdAt = new Date(Date.now() - (bugSeedData.length - bugIndex) * 3600 * 1000).toISOString();
    const result = insertBug.run({
      title: bug.title,
      description: bug.description,
      steps_to_reproduce: bug.steps_to_reproduce,
      expected: bug.expected,
      actual: bug.actual,
      environment: bug.environment,
      severity: bug.severity,
      priority: bug.priority,
      status: bug.status,
      created_at: createdAt,
      updated_at: bug.activity.length ? now : createdAt,
    });

    bug.activity.forEach((entry, index) => {
      insertActivity.run({
        bug_id: result.lastInsertRowid,
        action: entry.action,
        old_value: entry.old_value,
        new_value: entry.new_value,
        message: entry.message,
        timestamp: new Date(Date.now() - (bug.activity.length - index) * 1800 * 1000).toISOString(),
      });
    });
  });
}

const runSeedCount = db.prepare('SELECT COUNT(*) AS count FROM test_runs_v2').get().count;

if (runSeedCount === 0) {
  const seedSuite = db.prepare('SELECT id FROM suites WHERE name = ?').get('Login regression suite');

  if (seedSuite) {
    const suiteCaseIds = db
      .prepare('SELECT test_case_id FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
      .all(seedSuite.id)
      .map((r) => r.test_case_id);

    if (suiteCaseIds.length > 0) {
      const startTime = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      const endTime = new Date(Date.now() - 2 * 3600 * 1000 + 8 * 60 * 1000).toISOString();

      // Mixed results: first case passes, second fails (with a note and a
      // simulated already-sent alert — this is seed data, not a live event,
      // so it deliberately does NOT call the real Discord webhook), rest skipped.
      const resultsByPosition = ['passed', 'failed', 'skipped'];

      const runResult = db
        .prepare(`
          INSERT INTO test_runs_v2 (suite_id, status, pass_count, fail_count, skip_count, start_time, end_time, created_by)
          VALUES (@suite_id, 'completed', @pass_count, @fail_count, @skip_count, @start_time, @end_time, @created_by)
        `)
        .run({
          suite_id: seedSuite.id,
          pass_count: suiteCaseIds.filter((_, i) => resultsByPosition[i % 3] === 'passed').length,
          fail_count: suiteCaseIds.filter((_, i) => resultsByPosition[i % 3] === 'failed').length,
          skip_count: suiteCaseIds.filter((_, i) => resultsByPosition[i % 3] === 'skipped').length,
          start_time: startTime,
          end_time: endTime,
          created_by: 'magdalena.a.zalcmane@testdevlab.com',
        });

      const insertResult = db.prepare(`
        INSERT INTO test_run_results (run_id, test_case_id, result, duration_ms, notes, failed_at, alert_sent_at)
        VALUES (@run_id, @test_case_id, @result, @duration_ms, @notes, @failed_at, @alert_sent_at)
      `);

      suiteCaseIds.forEach((testCaseId, index) => {
        const outcome = resultsByPosition[index % 3];
        insertResult.run({
          run_id: runResult.lastInsertRowid,
          test_case_id: testCaseId,
          result: outcome,
          duration_ms: 1200 + index * 300,
          notes: outcome === 'failed' ? 'Login page redirected to a 500 error page instead of showing the dashboard.' : null,
          failed_at: outcome === 'failed' ? endTime : null,
          alert_sent_at: outcome === 'failed' ? endTime : null,
        });
      });
    }
  }
}

const reportSeedCount = db.prepare('SELECT COUNT(*) AS count FROM reports').get().count;

if (reportSeedCount === 0) {
  const seedRun = db
    .prepare(`
      SELECT r.*, s.name AS suite_name
      FROM test_runs_v2 r
      JOIN suites s ON s.id = r.suite_id
      WHERE s.name = 'Login regression suite'
      ORDER BY r.start_time ASC
      LIMIT 1
    `)
    .get();

  if (seedRun) {
    const results = db
      .prepare(`
        SELECT rr.test_case_id, rr.result, rr.notes, rr.failed_at, tc.title, tc.severity
        FROM test_run_results rr
        JOIN test_cases tc ON tc.id = rr.test_case_id
        WHERE rr.run_id = ?
        ORDER BY rr.id ASC
      `)
      .all(seedRun.id);

    db.prepare(`
      INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
      VALUES (@run_id, @suite_name, @run_date, @total_count, @passed_count, @failed_count, @skipped_count, @results, @generated_at)
    `).run({
      run_id: seedRun.id,
      suite_name: seedRun.suite_name,
      run_date: seedRun.start_time,
      total_count: results.length,
      passed_count: seedRun.pass_count,
      failed_count: seedRun.fail_count,
      skipped_count: seedRun.skip_count,
      results: JSON.stringify(results),
      generated_at: seedRun.end_time || new Date().toISOString(),
    });
  }
}

const preferencesRow = db.prepare('SELECT id FROM user_preferences WHERE id = 1').get();

if (!preferencesRow) {
  db.prepare(`
    INSERT INTO user_preferences (id, theme, default_severity_for_new_bugs, default_page_size, timezone, auto_generate_report_after_run, updated_at)
    VALUES (1, 'system', 'Minor', 20, NULL, 1, ?)
  `).run(new Date().toISOString());
}

export default db;
