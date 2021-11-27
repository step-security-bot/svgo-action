import type { error } from "../types";

const enum OutputName {
  DID_OPTIMIZE = "DID_OPTIMIZE",
  OPTIMIZED_COUNT = "OPTIMIZED_COUNT",
  SVG_COUNT = "SVG_COUNT",
}

function getOutputNamesFor(event: string): [OutputName[], error] {
  switch (event) {
  default:
    return [[
      OutputName.DID_OPTIMIZE,
      OutputName.OPTIMIZED_COUNT,
      OutputName.SVG_COUNT,
    ], null];
  }
}

export {
  getOutputNamesFor,
  OutputName,
};
