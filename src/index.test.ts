import { VERSION } from "./index";
import pkg from "../package.json";
test("VERSION matches package.json", () => { expect(VERSION).toBe(pkg.version); });
