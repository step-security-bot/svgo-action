import type { SupportedSvgoVersions } from "../../src/svgo";

jest.dontMock("svgo-v2");

jest.mock("import-cwd");

import importCwd from "import-cwd";
import svgoV2 from "svgo-v2"; // eslint-disable-line import/default

import SVGO from "../../src/svgo";

const importCwdSilent = importCwd.silent as jest.MockedFunction<typeof importCwd.silent>; // eslint-disable-line max-len

describe("package svgo", () => {
  const consoleErrorBackup = console.error; // eslint-disable-line no-console

  const validSvg = "<svg role=\"img\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><title>GitHub Actions</title><path d=\"M10.984 13.836a.5.5 0 0 1-.353-.146l-.745-.743a.5.5 0 1 1 .706-.708l.392.391 1.181-1.18a.5.5 0 0 1 .708.707l-1.535 1.533a.504.504 0 0 1-.354.146zm9.353-.147l1.534-1.532a.5.5 0 0 0-.707-.707l-1.181 1.18-.392-.391a.5.5 0 1 0-.706.708l.746.743a.497.497 0 0 0 .706-.001zM4.527 7.452l2.557-1.585A1 1 0 0 0 7.09 4.17L4.533 2.56A1 1 0 0 0 3 3.406v3.196a1.001 1.001 0 0 0 1.527.85zm2.03-2.436L4 6.602V3.406l2.557 1.61zM24 12.5c0 1.93-1.57 3.5-3.5 3.5a3.503 3.503 0 0 1-3.46-3h-2.08a3.503 3.503 0 0 1-3.46 3 3.502 3.502 0 0 1-3.46-3h-.558c-.972 0-1.85-.399-2.482-1.042V17c0 1.654 1.346 3 3 3h.04c.244-1.693 1.7-3 3.46-3 1.93 0 3.5 1.57 3.5 3.5S13.43 24 11.5 24a3.502 3.502 0 0 1-3.46-3H8c-2.206 0-4-1.794-4-4V9.899A5.008 5.008 0 0 1 0 5c0-2.757 2.243-5 5-5s5 2.243 5 5a5.005 5.005 0 0 1-4.952 4.998A2.482 2.482 0 0 0 7.482 12h.558c.244-1.693 1.7-3 3.46-3a3.502 3.502 0 0 1 3.46 3h2.08a3.503 3.503 0 0 1 3.46-3c1.93 0 3.5 1.57 3.5 3.5zm-15 8c0 1.378 1.122 2.5 2.5 2.5s2.5-1.122 2.5-2.5-1.122-2.5-2.5-2.5S9 19.122 9 20.5zM5 9c2.206 0 4-1.794 4-4S7.206 1 5 1 1 2.794 1 5s1.794 4 4 4zm9 3.5c0-1.378-1.122-2.5-2.5-2.5S9 11.122 9 12.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5zm9 0c0-1.378-1.122-2.5-2.5-2.5S18 11.122 18 12.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5zm-13 8a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm12 0c0 1.93-1.57 3.5-3.5 3.5a3.503 3.503 0 0 1-3.46-3.002c-.007.001-.013.005-.021.005l-.506.017h-.017a.5.5 0 0 1-.016-.999l.506-.017c.018-.002.035.006.052.007A3.503 3.503 0 0 1 20.5 17c1.93 0 3.5 1.57 3.5 3.5zm-1 0c0-1.378-1.122-2.5-2.5-2.5S18 19.122 18 20.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5z\"/></svg>"; // eslint-disable-line max-len
  const invalidSvg = "<svg";

  class svgoV1Mock {
    optimize(svg: string): { data: string } {
      if (svg === validSvg) {
        return { data: svg };
      } else {
        throw new Error();
      }
    }
  }

  beforeAll(() => {
    // prevent SVGO v1 from outputting an error
    console.error = () => void 0; // eslint-disable-line no-console
  });

  describe("::New", () => {
    const svgoConfig = { };

    describe.each([
      ["2", undefined],
      ["project", svgoV1Mock],
      ["project", svgoV2],
    ])("::optimize (%s, %s)", (svgoVersion, svgoImport) => {
      const config = {
        svgoVersion: {
          value: svgoVersion as SupportedSvgoVersions,
        },
      };

      beforeEach(() => {
        importCwdSilent.mockReturnValue(svgoImport);
      });

      test("valid SVG", async () => {
        const [svgo, err0] = SVGO.New({ config, svgoConfig });
        expect(err0).toBeNull();

        const [result, err1] = await svgo.optimize(validSvg);
        expect(err1).toBeNull();
        expect(result).toBeDefined();
      });

      test("invalid SVG", async () => {
        const [svgo, err0] = SVGO.New({ config, svgoConfig });
        expect(err0).toBeNull();

        const [, err1] = await svgo.optimize(invalidSvg);
        expect(err1).not.toBeNull();
      });

      test("invalid options", async () => {
        const svgoConfig = {
          error: true,
          plugins: [
            { },
          ],
        };

        const [svgo, err0] = SVGO.New({ config, svgoConfig });
        expect(err0).toBeNull();

        const [, err1] = await svgo.optimize(validSvg);
        expect(svgoVersion === "2" ? err1 : "").not.toBeNull(); // eslint-disable-line jest/no-conditional-in-test
      });
    });

    describe("initialization fails", () => {
      const svgoConfig = { };

      test("invalid svgo-version", () => {
        const config = {
          svgoVersion: {
            value: "foobar" as SupportedSvgoVersions,
          },
        };

        const [, err] = SVGO.New({ config, svgoConfig });
        expect(err).not.toBeNull();
      });

      test("project-level SVGO missing", () => {
        importCwdSilent.mockReturnValueOnce(undefined);

        const config = {
          svgoVersion: {
            value: "project" as SupportedSvgoVersions,
          },
        };

        const [, err] = SVGO.New({ config, svgoConfig });
        expect(err).not.toBeNull();
      });
    });
  });

  afterAll(() => {
    console.error = consoleErrorBackup; // eslint-disable-line no-console
  });
});
