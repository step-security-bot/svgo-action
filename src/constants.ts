// Action events
export const EVENT_PULL_REQUEST = "pull_request";
export const EVENT_PUSH = "push";
export const EVENT_REPOSITORY_DISPATCH = "repository_dispatch";
export const EVENT_SCHEDULE = "schedule";
export const EVENT_WORKFLOW_DISPATCH = "workflow_dispatch";
export const SUPPORTED_EVENTS: string[] = [
  EVENT_PULL_REQUEST,
  EVENT_PUSH,
  EVENT_REPOSITORY_DISPATCH,
  EVENT_SCHEDULE,
  EVENT_WORKFLOW_DISPATCH,
];

// Action inputs
export const INPUT_NAME_COMMENT = "comment";
export const INPUT_NAME_CONFIG_PATH = "configuration-path";
export const INPUT_NAME_DRY_RUN = "dry-run";
export const INPUT_NAME_IGNORE = "ignore";
export const INPUT_NAME_REPO_TOKEN = "repo-token";
export const INPUT_NAME_SVGO_OPTIONS = "svgo-options";
export const INPUT_NAME_SVGO_VERSION = "svgo-version";
export const INPUT_NOT_REQUIRED = { required: false };
export const INPUT_REQUIRED = { required: true };

// Action defaults
export const DEFAULT_CONFIG_PATH = ".github/svgo-action.yml";
export const DEFAULT_COMMENT = `
  SVG(s) automatically optimized using [SVGO] :sparkles:

  {{filesTable}}

  {{warnings}}

  [SVGO]: https://github.com/svg/svgo
`;
export const DEFAULT_SVGO_OPTIONS = "svgo.config.js";

// Action outputs
export const OUTPUT_NAME_DID_OPTIMIZE = "DID_OPTIMIZE";
export const OUTPUT_NAME_OPTIMIZED_COUNT = "OPTIMIZED_COUNT";
export const OUTPUT_NAME_SKIPPED_COUNT = "SKIPPED_COUNT";
export const OUTPUT_NAME_SVG_COUNT = "SVG_COUNT";

// File encodings
export const BASE64 = "base64";
export const UTF8 = "utf-8";

// Special values
export const PR_NOT_FOUND = -1;
