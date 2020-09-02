import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/core";

import { EVENT_PULL_REQUEST, EVENT_PUSH } from "./constants";
import { getRepoToken, getConfigFilePath, ActionConfig } from "./inputs";
import { SVGOptimizer, SVGOptions } from "./svgo";
import { RawActionConfig } from "./types";

import prEventMain from "./events/pull-request";
import pushEventMain from "./events/push";

import { fetchYamlFile } from "./utils/fetch-yaml";


async function run(
  client: Octokit,
  config: ActionConfig,
  svgo: SVGOptimizer,
): Promise<void> {
  try {
    const event = github.context.eventName;
    switch (event) {
      case EVENT_PULL_REQUEST:
        core.info("Running SVGO Action in Pull Request context");
        await prEventMain(client, config, svgo);
        break;
      case EVENT_PUSH:
        core.info("Running SVGO Action in push context");
        await pushEventMain(client, config, svgo);
        break;
      default:
        throw new Error(`Event '${event}' not supported`);
    }
  } catch (error) {
    core.setFailed(`action failed with error '${error}'`);
  }
}


export default async function main(): Promise<void> {
  const token: string = getRepoToken();
  const client: Octokit = github.getOctokit(token);

  const configFilePath: string = getConfigFilePath();
  const rawConfig: RawActionConfig = await fetchYamlFile(
    client,
    configFilePath,
  );

  const config: ActionConfig = new ActionConfig(rawConfig);
  if (config.isDryRun) {
    core.info("Dry mode enabled, no changes will be committed");
  }

  const svgoOptions: SVGOptions = await fetchYamlFile(
    client,
    config.svgoOptionsPath,
  );
  const svgo: SVGOptimizer = new SVGOptimizer(svgoOptions);

  run(client, config, svgo);
}

main();
