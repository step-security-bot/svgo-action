# Contributing Guidelines

The _SVGO Action_ project welcomes contributions and corrections of all forms.
This includes improvements to the documentation or code base, new tests, bug
fixes, and implementations of new features. We recommend you [open an issue]
before making any substantial changes so you can be sure your work won't be
rejected. But for changes such as fixing a typo you can open a Pull Request
directly.

If you plan to make a contribution, please do make sure to read through the
relevant sections of this document.

- [Reporting Issues](#reporting-issues)
  - [Security](#security)
  - [Bug Reports](#bug-reports)
  - [Feature Requests](#feature-requests)
  - [Corrections](#corrections)
- [Making Changes](#making-changes)
  - [Project Setup](#project-setup)
  - [Workflow](#workflow)
  - [Development Details](#development-details)
- [Testing](#testing)
  - [Mocking](#mocking)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)

> **Note** If you want to make a contribution to v2 of the Action, please refer
> to the [Contributing Guidelines for v2].

---

## Reporting Issues

### Security

For security related issues, please refer to the [security policy].

### Bug Reports

If you have problems with the _SVGO Action_ or think you've found a bug, please
report it to the developers; we ask you to **always** open an issue describing
the bug as soon as possible so that we, and others, are aware of the bug.

Before reporting a bug, make sure you've actually found a real bug. Carefully
read the documentation and see if it really says you can do what you're trying
to do. If it's not clear whether you should be able to do something or not,
report that too; it's a bug in the documentation! Also, make sure the bug has
not already been reported.

When preparing to report a bug, try to isolate it to a small working example
that reproduces the problem. Once you have this, collect additional information
such as:

- The exact version of SVGO Action you're using.
- A description of the expected behaviour and the actual behaviour.
- All error and warning messages.
- A link to a workflow run where the bug occurs with [debug logging] enabled.

Once you have a precise problem you can report it as a [bug report].

### Feature Requests

New features are welcomed, but we want to avoid feature creep. For this reason
we recommend you open a [feature request] first so you don't spend time working
on something that won't be included. Be sure to check if the feature hasn't been
requested before.

### Corrections

Corrections, such as fixing typos or refactoring code, are important. For
smaller changes of this nature you can open a Pull Request directly, or [open an
issue] first if you prefer.

---

## Making Changes

You are always free to contribute by working on one of the confirmed [open
bug reports], approved [open feature requests], or any of the other accepted
[open issues] and opening a Pull Request for it.

It is advised to indicate that you will be working on a issue by commenting on
that issue. This is so others don't start working on the same issue as you are.
Also, don't start working on an issue which someone else is working on - give
everyone a chance to make contributions.

When you open a Pull Request that implements an issue make sure to link to that
issue in the Pull Request description and explain how you implemented the issue
as clearly as possible.

> **Note** If you, for whatever reason, can no longer continue your contribution
> please share this in the issue or your Pull Request. This gives others the
> opportunity to work on it. If we don't hear from you for an extended period of
> time we may decide to allow others to work on the issue you were assigned to.

### Project Setup

To be able to contribute you need at least the following:

- _Git_;
- _Node.js_ v18 or higher and _npm_ v8.1.2 or higher;
- (Recommended) A code editor with _[EditorConfig]_ support;
- (Optional) _[`nektos/act`]_;

We use [Husky] to automatically install git hooks. Please enable it when
contributing to _SVGO Action_. If you have npm installation scripts disabled,
run `npm run prepare` after installing dependencies.

### Workflow

If you decide to make a contribution, please use the following workflow:

- Fork the repository.
- Create a new branch from the latest `main`.
- Make your changes on the new branch.
- Commit to the new branch and push the commit(s).
- Open a Pull Request against `main`.

### Development Details

Before you start making changes you should run `npm install`. This ensures your
local development environment is setup and ready to go.

When making changes it is important that 1) your changes are properly formatted
and 2) your changes are properly tested (if it is a code change). The former can
be achieved with the `npm run format` command. The latter requires you to add
new test cases to the project, you can use `npm run test` to verify the new (and
old) tests pass. See the [testing](#testing) section for more details.

#### Linting

This project uses [ESLint], [markdownlint], and [editorconfig-checker] for
linting. If you make changes to the code or documentation, make sure to follow
the code style that is enforced through the linters. Use `npm run lint` to check
the code style or `npm run format` to format changes in accordance with the code
style.

If you want to improve the code style, update the configuration file for the
respective linter accordingly. If you need an extra package to be able to
enforce your style please add it as a `devDependency`.

> **Note** Keep in mind that the developers of the project determine the code
> style as they see fit. For this reason, take the time to explain why you think
> your changes improve the project.

#### Vetting

The project is vetted using a small collection of static analysis tools. Run
`npm run vet` to analyze the project for potential problems.

#### Building

This project uses [rollup.js] to compile the source code into a standalone
JavaScript file. This file can be found in the `lib/` directory. The file is
generated using the `npm run build` command; you can run this command to see if
your changes are valid.

You should **NOT** include changes to this file when committing. If you try to
commit it, the pre-commit hook will automatically unstage the changes. Instead,
the file will be updated automatically prior to a release.

---

## Testing

It is important to test any changes and equally important to add tests for
previously untested code. Tests for this project are written using [Jest]. All
tests go into the `test/` folder and all test files should follow the naming
convention `[FILENAME].test.ts`.

The tests for _SVGO Action_ are split between unit and integration test. Various
commands are available to run the tests, as shown in the overview below. You can
run a command as `npm run [SCRIPT]:[MODIFIER]`, e.g. `npm run test` or
`npm run coverage:unit`.

| Script             | Modifier           | Description            |
| :----------------- | :----------------- | :--------------------- |
| `test`, `coverage` | `all` _(optional)_ | Runs all tests         |
| `test`, `coverage` | `unit`             | Runs unit tests        |
| `test`, `coverage` | `integration`      | Runs integration tests |
| `test`             | `e2e`              | Runs end-to-end tests  |
| `test`             | `mutation`         | Runs mutation tests    |

Whenever you use the `coverage` variant of a script, a coverage report will be
generated. The report is available in HTML format at
`_reports/coverage/[MODIFIER]/lcov-report/index.html`.

### Mocking

We make extensive use of [mocking]. A mock for a particular file goes into the
`__mocks__` folder in the folder of that file. The name of a mock file should
always match the name of the file it mocks.

Mocks for Node.js modules go into the `__mocks__` directory at the root of the
project. The name of the mock file should always match the name of the Node.js
module. For scoped Node.js modules, the mock file should be placed in a folder
with the name of the scope. For example, the mock for `@actions/core` can be
found at `__mocks__/@actions/core.ts`.

Any non-mock file inside a `__mocks__` folder should follow the naming
convention `__[FILENAME]__.ts`. Any mock that is not tied to a file or Node.js
module should be placed in the `test/__common__` folder and follow the naming
convention `[FILENAME].mock.ts`.

### Unit Tests

All unit tests go into the `test/unit` folder, which mimics the structure of the
`src/` folder. To run unit tests you can use the `npm run test:unit` command.
Use `npm run coverage:unit` to run unit tests and get a coverage report.

A unit test suite should cover one and only one file. For examples of how to
achieve this you can study existing unit tests. To check that a unit test does
not rely on any other code you can run the following command and check the
resulting coverage report.

```shell
npm run coverage -- test/unit/[PATH TO FILE]
```

#### Mutation Testing

The quality of unit tests is measured using [mutation testing]. We use the
mutation testing framework [StrykerJS]. Use the command `npm run test:mutation`
to run the mutation tests.

After running the mutation tests, a mutation report is available in HTML format
at `_reports/mutation/index.html`. Alternatively, you can find a report for the
`main` branch online as a [Stryker Dashboard].

By default the mutation tests run on all the source code using all the unit
tests. Since this is a slow process, you can change the mutation test config (in
`stryker.config.js`) to focus on a subset of the source code or unit tests (we
ask that you don't commit such changes). For example, to run mutation tests for
a particular file you can change the Stryker configuration as follows.

```diff
  mutate: [
-   "src/**/*.ts",
+   "src/path/to/file.ts",
    "!src/**/*.d.ts",
    "!src/**/__mocks__/**/*.ts",
  ],
  commandRunner: {
-   command: "npm run test:unit -- --runInBand",
+   command: "npm run test -- --runInBand test/unit/path/to/file.test.ts",
  },
```

### Integration Tests

All integrations tests go into the `test/integration` folder, which mimics the
top-level structure of the `src/` folder. To run integration tests you can use
the `npm run test:integration` command. Use `npm run coverage:integration` to
run the integration tests and get a coverage report.

An integration test suite aims to verify that different units work together
correctly. As such, while an integration test should still focus on one thing,
it is generally not necessary to mock anything (exceptions include file system
operations and network communication).

### End-to-End Tests

The end-to-end tests are defined in the `test-e2e` job in the GitHub Actions
workflow file `push-checks.yml`. The test operate with and on the fixtures found
in `test/end-to-end`. During end-to-end testing, the Action is run as if it was
triggered by a `schedule` event.

The end-to-end tests verify three things:

1. That the source code (in `src/`, not `lib/`) can be run as an Action,
1. That the Action outputs are correct, and
1. That SVGs are modified on disk.

#### Running End-to-end Tests Locally

You can use [`nektos/act`] to run the end-to-end tests locally. If you have the
`act` program available on your PATH you can use `npm run test:e2e` to run the
end-to-end tests.

There are some limitations to using [`nektos/act`]:

- It depends on [Docker] to run workflows.
- Your system may not support all operating systems the tests should run on.
  Hence, the end-to-end tests may succeed locally but fail on GitHub because you
  couldn't run them for all operating systems.
- All jobs that the end-to-end test job `needs` have to be executed as well.

[bug report]: https://github.com/ericcornelissen/svgo-action/issues/new?labels=bug&template=bug_report.md
[contributing guidelines for v2]: https://github.com/ericcornelissen/svgo-action/blob/main-v2/CONTRIBUTING.md
[debug logging]: https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging
[docker]: https://www.docker.com/
[editorconfig]: https://editorconfig.org/
[editorconfig-checker]: https://editorconfig-checker.github.io/
[eslint]: https://eslint.org/
[feature request]: https://github.com/ericcornelissen/svgo-action/issues/new?labels=enhancement&template=feature_request.md
[husky]: https://typicode.github.io/husky/#/
[jest]: https://jestjs.io/
[markdownlint]: https://github.com/DavidAnson/markdownlint
[mocking]: https://stackoverflow.com/a/2666006
[mutation testing]: https://en.wikipedia.org/wiki/Mutation_testing
[`nektos/act`]: https://github.com/nektos/act
[open an issue]: https://github.com/ericcornelissen/svgo-action/issues/new/choose
[open bug reports]: https://github.com/ericcornelissen/svgo-action/issues?q=is%3Aopen+is%3Aissue+label%3Abug
[open feature requests]: https://github.com/ericcornelissen/svgo-action/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement+
[open issues]: https://github.com/ericcornelissen/svgo-action/issues
[rollup.js]: https://rollupjs.org/guide/en/
[security policy]: ./SECURITY.md
[strykerjs]: https://stryker-mutator.io/
[stryker dashboard]: https://dashboard.stryker-mutator.io/reports/github.com/ericcornelissen/svgo-action/main
