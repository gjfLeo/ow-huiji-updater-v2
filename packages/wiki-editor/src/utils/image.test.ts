import { describe, expect, test } from "bun:test";
import { getFilenameFromUrl } from "./image";

describe("getFilenameFromUrl", () => {
  const urlWithRevision = "https://static.wikia.nocookie.net/overwatch_gamepedia/images/a/a0/OW2_Cassidy.png/revision/latest?cb=20241108201305";
  const urlWithoutRevision = "https://static.wikia.nocookie.net/overwatch_gamepedia/images/a/a0/OW2_Cassidy.png";
  test("should return the filename from the URL", () => {
    expect(getFilenameFromUrl(urlWithRevision))
      .toBe("OW2_Cassidy.png");
    expect(getFilenameFromUrl(urlWithoutRevision))
      .toBe("OW2_Cassidy.png");
  });
});
