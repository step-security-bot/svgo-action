import { when } from "jest-when";
import { format as strFormat } from "util";

import actionOptions from "./fixtures/svgo-action.json";
import contentPayloads from "./fixtures/contents-payloads.json";
import files from "./fixtures/file-data.json";
import svgoOptions from "./fixtures/svgo-options.json";

import * as core from "./mocks/@actions/core.mock";
import * as github from "./mocks/@actions/github.mock";
import { PR_NUMBER } from "./mocks/@actions/github.mock";
import * as encoder from "./mocks/encoder.mock";
import * as githubAPI from "./mocks/github-api.mock";
import * as inputs from "./mocks/inputs.mock";
import * as svgo from "./mocks/svgo.mock";
import * as templating from "./mocks/templating.mock";

jest.mock("@actions/core", () => core);
jest.mock("@actions/github", () => github);
jest.mock("../src/encoder", () => encoder);
jest.mock("../src/github-api", () => githubAPI);
jest.mock("../src/inputs", () => inputs);
jest.mock("../src/svgo", () => svgo);
jest.mock("../src/templating", () => templating);

import { PR_NOT_FOUND } from "../src/constants";
import main from "../src/main";


beforeEach(() => {
  core.debug.mockClear();
  core.error.mockClear();
  core.info.mockClear();
  core.setFailed.mockClear();
  core.warning.mockClear();

  encoder.decode.mockClear();
  encoder.encode.mockClear();

  githubAPI.commitFiles.mockClear();
  githubAPI.createBlob.mockClear();
  githubAPI.createComment.mockClear();
  githubAPI.getPrFile.mockClear();
  githubAPI.getPrFiles.mockClear();
  githubAPI.getPrNumber.mockClear();

  inputs.ActionConfig.mockClear();

  svgo.SVGOptimizer.mockClear();
  svgo.OptimizerInstance.optimize.mockClear();

  templating.formatCommitMessage.mockClear();
});

test("get the Pull Request number", async () => {
  await main();
  expect(githubAPI.getPrNumber).toHaveBeenCalledTimes(1);
});

describe("Logging", () => {

  test("does some debug logging", async () => {
    await main();
    expect(core.debug).toHaveBeenCalled();
  });

  test("summary for a Pull Request with 1 optimized SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);

    await main();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("optimized 1/1 SVG(s)"));
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("0/1 SVG(s) skipped"));
  });

  test("summary for a Pull Request with 1 skipped SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_OPTIMIZED_SVG);

    await main();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("optimized 0/1 SVG(s)"));
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("1/1 SVG(s) skipped"));
  });

  test("summary for a Pull Request with many changes", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.MANY_CHANGES);

    await main();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("optimized 3/4 SVG(s)"));
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("1/4 SVG(s) skipped"));
  });

  test("don't log an error when everything is fine", async () => {
    await main();
    expect(core.error).not.toHaveBeenCalled();
  });

  test("don't set a failed state when everything is fine", async () => {
    await main();
    expect(core.setFailed).not.toHaveBeenCalled();
  });

});

describe("Configuration", () => {

  test("use custom configuration file", async () => {
    const actionConfigFilePath = "svgo-action.yml";
    inputs.getConfigFilePath.mockReturnValueOnce(actionConfigFilePath);

    await main();

    expect(inputs.ActionConfig).toHaveBeenCalledWith(actionOptions);
  });

  test("dry mode enabled", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.isDryRun = true;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("Dry mode enabled"));
  });

  test("dry mode disabled", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.isDryRun = false;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.commitFiles).toHaveBeenCalled();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("Dry mode enabled"));
  });

  test("use an SVGO options file in the repository", async () => {
    const svgoOptionsPath = ".svgo.yml";
    const actionConfig = new inputs.ActionConfig();
    actionConfig.svgoOptionsPath = svgoOptionsPath;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);
    when(githubAPI.getRepoFile)
      .calledWith(github.GitHubInstance, svgoOptionsPath)
      .mockResolvedValueOnce(contentPayloads[svgoOptionsPath]);

    await main();

    expect(svgo.SVGOptimizer).toHaveBeenCalledWith(svgoOptions);
  });

  test.each([
    "This should be a commit title",
    "Why not Zoidberg",
    "A templated commit title? {{optimizedCount}}",
  ])("custom commit message title (%s)", async (commitTitle) => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.commitTitle = commitTitle;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(templating.formatCommitMessage).toHaveBeenCalledWith(
      commitTitle,
      expect.any(String),
      expect.any(Object),
    );
  });

  test.each([
    "This should be a commit body",
    "Shut up and take my money",
    "A templated commit title? {{filesList}}",
  ])("custom commit message body (%s)", async (commitBoy) => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.commitBody = commitBoy;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(templating.formatCommitMessage).toHaveBeenCalledWith(
      expect.any(String),
      commitBoy,
      expect.any(Object),
    );
  });

  test("conventional-commits are enabled", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.commitTitle = "chore: optimize {{optimizedCount}} SVG(s)";
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);

    await main();

    expect(templating.formatCommitMessage).toHaveBeenCalledWith(
      actionConfig.commitTitle,
      expect.any(String),
      expect.any(Object),
    );
  });

  test("configure a glob to ignore files", async () => {
    const filePath = "foo.svg";
    const { content: fileContent, encoding: fileEncoding } = contentPayloads[filePath];
    const fooSvgData = files[filePath];

    const actionConfig = new inputs.ActionConfig();
    actionConfig.ignoreGlob = "foo/*";

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG_AND_SVG_IN_DIR);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(encoder.decode).toHaveBeenCalledWith(fileContent, fileEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(fooSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(1);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), fileEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      filePath,
      expect.any(String),
      fileEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: filePath }),
      ]),
      expect.any(String),
    );
  });

});

describe("Manual Action control", () => {

  test.each([
    ["But why is the rum gone"],
    ["Asiimov", "It's dangerous to go alone!", "Praise the sun"],
    ["The Spanish Inquisition", "No this is Patrick!"],
  ])("comments on the Pull Request that don't disable the Action", async (...comments) => {
    githubAPI.getPrComments.mockResolvedValueOnce(comments);

    await main();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test.each([
    ["Let's disable the action! (%s)"],
    ["Hello world!", "%s"],
    ["foo", "foo %s bar", "bar"],
    ["%s", "Yip Yip!", "%s"],
  ])("comments on the Pull Request that *do* disable the Action", async (...baseComments) => {
    githubAPI.getPrComments.mockResolvedValueOnce(
      baseComments.map((comment) => strFormat(comment, "disable-svgo-action")),
    );

    await main();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test("comments on the Pull Request that enables the action", async () => {
    githubAPI.getPrComments.mockResolvedValueOnce(
      ["I don't know what I'm doing but enable-svgo-action"],
    );

    await main();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test("comments on the Pull Request that first disable and then enables the action", async () => {
    githubAPI.getPrComments.mockResolvedValueOnce([
      // Newest comment
      "The Spanish Inquisition",
      "In this comment we enable the action (enable-svgo-action)",
      "Bla bla",
      "Discussion",
      "In this comment we disable the action (disable-svgo-action)",
      // Oldest comment
    ]);

    await main();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test("comments on the Pull Request that first enables and then disable the action", async () => {
    githubAPI.getPrComments.mockResolvedValueOnce([
      // Newest comment
      "No, I don't want the Action to run! disable-svgo-action",
      "In this comment we enable the action (enable-svgo-action)",
      "Bar",
      "Foo",
      "In this comment we disable the action (disable-svgo-action)",
      // Oldest comment
    ]);

    await main();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test.each([
    "This is the commit title\n\nAnd this the message",
    "chore: make some changes\n\n- This isn't tennis\n- Praise the sun",
    "Added some SVGs to the website",
    "Double rainbow\n\nwhat does it mean?",
  ])("commit message that doesn't disables the Action (%s)", async (commitMessage) => {
    githubAPI.getCommitMessage.mockResolvedValueOnce(commitMessage);

    await main();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test.each([
    "This is the commit title\n\nAnd this the message (%s)",
    "chore: make some changes\n\n- This isn't tennis\n- Praise the sun\n\n%s",
    "Added some SVGs to the website\n\n%s",
    "Double rainbow\n\nwhat does it %s mean?",
  ])("commit message that *does* disables the Action", async (baseCommitMessage) => {
    const commitMessage = strFormat(baseCommitMessage, "disable-svgo-action");
    githubAPI.getCommitMessage.mockResolvedValueOnce(commitMessage);

    await main();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test("commit message that enables the action when it isn't disabled from the PR", async () => {
    githubAPI.getCommitMessage.mockResolvedValueOnce(
      "I don't know what I'm doing but enable-svgo-action",
    );

    await main();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  test("commit message that enables the action when it *is* disabled from the PR", async () => {
    // Verify the PR comment disables the Action
    githubAPI.getPrComments.mockResolvedValueOnce(["disable-svgo-action"]);
    await main();
    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));

    // Reset the info log so we can check it again
    core.info.mockClear();

    // The actual test
    githubAPI.getPrComments.mockResolvedValueOnce(["disable-svgo-action"]);
    githubAPI.getCommitMessage.mockResolvedValueOnce(
      "I don't know what I'm doing but enable-svgo-action",
    );

    await main();
    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining("disabled"));

    // Make sure the ResolveValueOnce for getPrComments is resolved before the next test
    await githubAPI.getPrComments();
  });

});

describe("Comments", () => {

  test("don't comment if comments are disabled", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.enableComments = false;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.createComment).not.toHaveBeenCalled();
  });

  test("comment on a Pull Request when there is a new SVG", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.enableComments = true;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.createComment).toHaveBeenCalledTimes(1);
  });

  test("comment on a Pull Request when there is a modified SVG", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.enableComments = true;

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.MODIFY_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.createComment).toHaveBeenCalledTimes(1);
  });

  test.each([
    PR_NUMBER.ADD_FILE,
    PR_NUMBER.REMOVE_SVG,
  ])("don't comment when there is no SVG added or modified", async (prNumber) => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.enableComments = true;

    githubAPI.getPrNumber.mockReturnValueOnce(prNumber);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.createComment).not.toHaveBeenCalled();
  });

  test.each([
    PR_NUMBER.ADD_FAKE_SVG,
    PR_NUMBER.ADD_OPTIMIZED_SVG,
  ])("don't comment when no SVG needed to be optimized", async (prNumber) => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.enableComments = true;

    githubAPI.getPrNumber.mockReturnValueOnce(prNumber);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(githubAPI.createComment).not.toHaveBeenCalled();
  });

  test("custom comment on a Pull Request", async () => {
    const actionConfig = new inputs.ActionConfig();
    actionConfig.enableComments = true;
    actionConfig.comment = "Hello world!";

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    inputs.ActionConfig.mockReturnValueOnce(actionConfig);

    await main();

    expect(templating.formatComment).toHaveBeenCalledWith(
      actionConfig.comment,
      expect.any(Object),
    );
  });

});

describe("Payloads", () => {

  const barFilePath = "bar.svg";
  const complexFilePath = "complex.svg";
  const fooFilePath = "foo.svg";
  const testFilePath = "test.svg";

  const { content: barSvgContent, encoding: barSvgEncoding } = contentPayloads[barFilePath];
  const { content: complexSvgContent, encoding: complexSvgEncoding } = contentPayloads[complexFilePath];
  const { content: fooSvgContent, encoding: fooSvgEncoding } = contentPayloads[fooFilePath];
  const { content: testSvgContent, encoding: testSvgEncoding } = contentPayloads[testFilePath];

  const barSvgData = files[barFilePath];
  const complexSvgData = files[complexFilePath];
  const fooSvgData = files[fooFilePath];
  const testSvgData = files[testFilePath];

  test("a Pull Request with 1 new SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(encoder.decode).toHaveBeenCalledWith(testSvgContent, testSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(testSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(1);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), testSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      testFilePath,
      expect.any(String),
      testSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: testFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 modified SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.MODIFY_SVG);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(encoder.decode).toHaveBeenCalledWith(fooSvgContent, fooSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(fooSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(1);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), fooSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      fooFilePath,
      expect.any(String),
      fooSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: fooFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 removed SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.REMOVE_SVG);

    await main();

    expect(encoder.decode).not.toHaveBeenCalled();
    expect(svgo.OptimizerInstance.optimize).not.toHaveBeenCalled();
    expect(encoder.encode).not.toHaveBeenCalled();
    expect(githubAPI.createBlob).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
  });

  test("a Pull Request with 1 new, 1 modified, and 1 removed SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_MODIFY_REMOVE_SVG);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(2);
    expect(encoder.decode).toHaveBeenCalledWith(fooSvgContent, fooSvgEncoding);
    expect(encoder.decode).toHaveBeenCalledWith(barSvgContent, barSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(2);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(fooSvgData);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(barSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(2);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), fooSvgEncoding);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), barSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(2);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      fooFilePath,
      expect.any(String),
      fooSvgEncoding,
    );
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      barFilePath,
      expect.any(String),
      barSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: fooFilePath }),
        expect.objectContaining({ path: barFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 new SVG and one new SVG in a directory", async () => {
    const foobarFilePath = "foo/bar.svg";

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG_AND_SVG_IN_DIR);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(2);
    expect(encoder.decode).toHaveBeenCalledWith(fooSvgContent, fooSvgEncoding);
    expect(encoder.decode).toHaveBeenCalledWith(barSvgContent, barSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(2);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(fooSvgData);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(barSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(2);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), fooSvgEncoding);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), barSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(2);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      fooFilePath,
      expect.any(String),
      fooSvgEncoding,
    );
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      foobarFilePath,
      expect.any(String),
      barSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: fooFilePath }),
        expect.objectContaining({ path: foobarFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 new file", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_FILE);

    await main();

    expect(encoder.decode).not.toHaveBeenCalled();
    expect(svgo.OptimizerInstance.optimize).not.toHaveBeenCalled();
    expect(encoder.encode).not.toHaveBeenCalled();
    expect(githubAPI.createBlob).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
  });

  test("a Pull Request with 1 modified file", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.MODIFY_FILE);

    await main();

    expect(encoder.decode).not.toHaveBeenCalled();
    expect(svgo.OptimizerInstance.optimize).not.toHaveBeenCalled();
    expect(encoder.encode).not.toHaveBeenCalled();
    expect(githubAPI.createBlob).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
  });

  test("a Pull Request with 1 removed file", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.REMOVE_FILE);

    await main();

    expect(encoder.decode).not.toHaveBeenCalled();
    expect(svgo.OptimizerInstance.optimize).not.toHaveBeenCalled();
    expect(encoder.encode).not.toHaveBeenCalled();
    expect(githubAPI.createBlob).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
  });

  test("a Pull Request with 1 new SVG and 1 modified file", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG_MODIFY_FILE);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(encoder.decode).toHaveBeenCalledWith(testSvgContent, testSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(testSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(1);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), testSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      testFilePath,
      expect.any(String),
      testSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: testFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 new file and 1 modified SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_FILE_MODIFY_SVG);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(encoder.decode).toHaveBeenCalledWith(testSvgContent, testSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(testSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(1);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), testSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      testFilePath,
      expect.any(String),
      testSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: testFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 new SVG and 1 deleted file", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG_REMOVE_FILE);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(encoder.decode).toHaveBeenCalledWith(complexSvgContent, complexSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(complexSvgData);

    expect(encoder.encode).toHaveBeenCalledTimes(1);
    expect(encoder.encode).toHaveBeenCalledWith(expect.any(String), complexSvgEncoding);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      complexFilePath,
      expect.any(String),
      complexSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: complexFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 new file and 1 deleted SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_FILE_REMOVE_SVG);

    await main();

    expect(encoder.decode).not.toHaveBeenCalled();
    expect(svgo.OptimizerInstance.optimize).not.toHaveBeenCalled();
    expect(encoder.encode).not.toHaveBeenCalled();
    expect(githubAPI.createBlob).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
  });

  test("a Pull Request with multiple SVGs and multiple files", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.MANY_CHANGES);

    await main();

    expect(encoder.decode).toHaveBeenCalledTimes(4);
    expect(encoder.decode).toHaveBeenCalledWith(fooSvgContent, fooSvgEncoding);
    expect(encoder.decode).toHaveBeenCalledWith(barSvgContent, barSvgEncoding);
    expect(encoder.decode).toHaveBeenCalledWith(testSvgContent, testSvgEncoding);

    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(4);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(fooSvgData);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(barSvgData);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledWith(testSvgData);

    expect(githubAPI.createBlob).toHaveBeenCalledTimes(3);
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      fooFilePath,
      expect.any(String),
      fooSvgEncoding,
    );
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      barFilePath,
      expect.any(String),
      barSvgEncoding,
    );
    expect(githubAPI.createBlob).toHaveBeenCalledWith(
      github.GitHubInstance,
      testFilePath,
      expect.any(String),
      testSvgEncoding,
    );

    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(githubAPI.commitFiles).toHaveBeenCalledWith(
      github.GitHubInstance,
      expect.arrayContaining([
        expect.objectContaining({ path: fooFilePath }),
        expect.objectContaining({ path: barFilePath }),
        expect.objectContaining({ path: testFilePath }),
      ]),
      expect.any(String),
    );
  });

  test("a Pull Request with 1 optimized SVG", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_OPTIMIZED_SVG);

    await main();

    expect(githubAPI.commitFiles).not.toHaveBeenCalled();
    expect(core.debug).toHaveBeenCalledWith(expect.stringMatching(/skipping.*optimized.svg/));
  });

  test.each([
    PR_NUMBER.NO_CHANGES,
    PR_NUMBER.REMOVE_SVG,
    PR_NUMBER.ADD_FILE,
    PR_NUMBER.MODIFY_FILE,
  ])("no new or changed SVGs (#%i)", async (prNumber) => {
    githubAPI.getPrNumber.mockReturnValueOnce(prNumber);

    await main();

    expect(core.info).toHaveBeenCalledWith(expect.stringMatching("Found 0/.+ new or changed SVGs"));
  });

});

describe("Error scenarios", () => {

  test("the Pull Request number could not be found", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NOT_FOUND);

    await main();

    expect(core.setFailed).toHaveBeenCalled();
  });

  test("the Pull Request files could not be found", async () => {
    githubAPI.getPrFiles.mockRejectedValueOnce(new Error("Not found"));

    await main();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test("a particular file could not be found", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    githubAPI.getPrFile.mockRejectedValueOnce(new Error("Not found"));

    await main();

    expect(core.setFailed).toHaveBeenCalledTimes(1);
  });

  test("the SVGO options file does not exist", async () => {
    const { svgoOptionsPath } = new inputs.ActionConfig();

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    when(githubAPI.getRepoFile)
      .calledWith(github.GitHubInstance, svgoOptionsPath)
      .mockRejectedValueOnce(new Error("Not found"));

    await main();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(core.debug).toHaveBeenCalledWith(expect.stringMatching(`not found.*${svgoOptionsPath}`));
  });

  test("the Action configuration file does not exist", async () => {
    const actionConfigPath = inputs.getConfigFilePath();

    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);
    when(githubAPI.getRepoFile)
      .calledWith(github.GitHubInstance, actionConfigPath)
      .mockRejectedValueOnce(new Error("Not found"));

    await main();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(1);
    expect(core.debug).toHaveBeenCalledWith(expect.stringMatching(`not found.*${actionConfigPath}`));
  });

  test("an SVG file that does not contain SVG content", async () => {
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_FAKE_SVG);

    await main();

    expect(core.info).toHaveBeenCalledWith(expect.stringContaining("cannot optimize"));

    expect(encoder.decode).toHaveBeenCalledTimes(1);
    expect(svgo.OptimizerInstance.optimize).toHaveBeenCalledTimes(1);
    expect(githubAPI.createBlob).toHaveBeenCalledTimes(0);
    expect(githubAPI.commitFiles).toHaveBeenCalledTimes(0);
  });

  test("blob size is too large", async () => {
    githubAPI.createBlob.mockImplementationOnce(() => { throw new Error("Blob too large"); });
    githubAPI.getPrNumber.mockReturnValueOnce(PR_NUMBER.ADD_SVG);

    await main();

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.warning).toHaveBeenCalledWith(expect.stringContaining("Blob could not be created"));
  });

});
