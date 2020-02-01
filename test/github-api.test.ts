import * as core from "@actions/core";
import * as github from "@actions/github";

jest.mock('@actions/core', () => require('./mocks/@actions/core'));
jest.mock('@actions/github', () => require('./mocks/@actions/github'));

import { getChangedFiles, getPrNumber, PR_NOT_FOUND } from "../src/github-api";


const PR_WITH_NO_CHANGES: number = 1;
const PR_WITH_ONE_SVG_CHANGED: number = 2;


describe("::getChangedFiles", () => {

  const token: string = core.getInput("repo-token", { required: true });
  const client: github.GitHub = new github.GitHub(token);

  test("return correctly for a Pull Request with 1 changed files", async () => {
    const changedFiles = await getChangedFiles(client, PR_WITH_ONE_SVG_CHANGED);
    expect(changedFiles).toBeDefined();
  });

  test("return correctly for a Pull Request with no changes", async () => {
    const changedFiles = await getChangedFiles(client, PR_WITH_NO_CHANGES);
    expect(changedFiles).toBeDefined();
  });

});

describe("::getPrNumber", () => {

  test.each([1, 2, 5, 42])("return the correct number for Pull Request #%i", (prNumber: number) => {
    github.context.payload.pull_request = { number: prNumber };

    const actual: number = getPrNumber();
    expect(actual).toBe(prNumber);
  });

  test(`return PR_NOT_FOUND (${PR_NOT_FOUND}) when there was no Pull Request in the context`, () => {
    github.context.payload.pull_request = undefined;

    const actual: number = getPrNumber();
    expect(actual).toBe(PR_NOT_FOUND);
  });

});
