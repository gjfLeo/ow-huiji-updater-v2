import path from "node:path";
import { load } from "cheerio";
import { ofetch } from "ofetch";
import { wikiLogin } from "../export";

interface StreamerModeNameData {
  zh: string;
  zhDesc: string;
  en: string;
  enDesc: string;
}

export default async function getStreamerModeNames() {
  const wiki = await wikiLogin({ userType: "user" });

  // MARK: 从中文Wiki读取已存在数据
  const oldData: StreamerModeNameData[] = [];
  const page = await wiki.getPageRawTextByTitle("主播模式");
  const pageContent = page?.content || "";
  const pageLines = pageContent.split("\n");
  const startLineIndex = pageLines.findIndex(line => line.startsWith("<!-- #streamerModeNames start")) + 1;
  const endLineIndex = pageLines.findIndex(line => line.startsWith("<!-- #streamerModeNames end"));
  if (startLineIndex === 0 || endLineIndex === -1) {
    throw new Error("未找到主播模式名称开始或结束注释");
  }
  for (let i = startLineIndex; i < endLineIndex; i += 5) {
    const zh = pageLines[i + 1]!.substring(1).trim();
    const zhDesc = pageLines[i + 2]!.substring(1).trim();
    const en = pageLines[i + 3]!.substring(1).trim();
    const enDesc = pageLines[i + 4]!.substring(1).trim();
    oldData.push({ zh, zhDesc, en, enDesc });
  }

  const enWikiPage = await ofetch("https://overwatch.fandom.com/wiki/Streamer_Mode");
  const $ = load(enWikiPage);
  const streamerModeNamesEn = $("#mw-content-text .wikitable")
    .find("tr td:first-child")
    .map((_, el) => $(el).text().trim())
    .toArray();

  const zhStrings: Record<string, { Value: string }> = await Bun.file(path.resolve(__dirname, "../../output/owlib/json/strings_zh.json")).json();
  const enStrings: Record<string, { Value: string }> = await Bun.file(path.resolve(__dirname, "../../output/owlib/json/strings_en.json")).json();

  const newData = streamerModeNamesEn.map<StreamerModeNameData>((en) => {
    const guid = Object.entries(enStrings).find(([, value]) => value.Value === en)?.[0];
    if (!guid) {
      throw new Error(`Streamer mode name "${en}" not found in enStrings`);
    }
    const old = oldData.find(item => item.en === en);
    return {
      zh: zhStrings[guid]?.Value || "",
      zhDesc: old?.zhDesc || "",
      en: enStrings[guid]?.Value || "",
      enDesc: old?.enDesc || "",
    };
  });

  pageLines.splice(
    startLineIndex,
    endLineIndex - startLineIndex,
    ...newData.flatMap(item => [
      "|-",
      `| ${item.zh}`,
      `| ${item.en}`,
      `| ${item.enDesc || item.zhDesc}`,
    ]),
  );

  await Bun.write(
    path.resolve(__dirname, "../../output/temp/主播模式.wikitext"),
    pageLines.join("\n"),
  );
}
