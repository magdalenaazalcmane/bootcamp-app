export const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];

export const STATUSES = ['draft', 'ready', 'passed', 'failed', 'skipped'];

export const STATUS_LABELS = {
  draft: 'Draft',
  ready: 'Ready',
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const SUITE_STATUSES = ['draft', 'ready', 'in-progress', 'passed', 'failed'];

export const SUITE_STATUS_LABELS = {
  draft: 'Draft',
  ready: 'Ready',
  'in-progress': 'In progress',
  passed: 'Passed',
  failed: 'Failed',
};

export const BUG_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const BUG_STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'reopened'];

export const BUG_STATUS_LABELS = {
  open: 'Open',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};

export const BUG_STATUS_TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
};

export const RUN_STATUS_LABELS = {
  'in-progress': 'In progress',
  completed: 'Completed',
};

export const RESULTS = ['passed', 'failed', 'skipped'];

export const RESULT_LABELS = {
  passed: 'Passed',
  failed: 'Failed',
  skipped: 'Skipped',
};
