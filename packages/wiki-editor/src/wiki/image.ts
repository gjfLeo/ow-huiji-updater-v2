// Special:Redirect/file 不支持 format=original，所以直接使用拼接链接

import type { MWPage, MWResponseBase } from "huijiwiki-api/dist/HuijiWiki/typeMWApiResponse";
import { Buffer } from "node:buffer";
import { confirm } from "@inquirer/prompts";
import { logger, spinnerProgress } from "../utils/logger";
import { wikiLogin } from "./login";

// const huijiImageUrl = "https://huiji-public.huijistatic.com/overwatch/uploads";
const fandomImageUrl = "https://static.wikia.nocookie.net/overwatch_gamepedia/images";

function getWikiImagePath(filename: string) {
  let normalizedName = filename.replaceAll("_", " ");
  if (!normalizedName.includes(".")) {
    normalizedName += ".png";
  }
  const hash = new Bun.CryptoHasher("md5").update(normalizedName).digest("hex");
  return `${hash.slice(0, 1)}/${hash.slice(0, 2)}/${normalizedName}`;
}

export function getFandomImageUrl(filename: string) {
  return `${fandomImageUrl}/${getWikiImagePath(filename)}`;
}

export async function wikiBatchUpload(
  files: Record<string, string>,
  options: {
    summary: string;
    text?: string;
    readBatchSize?: number;
  },
) {
  const { summary, text, readBatchSize = 50 } = options;

  const wiki = await wikiLogin({ userType: "bot" });
  const hasher = new Bun.CryptoHasher("sha1");

  const filesChanged: string[] = [];

  const filenames = Object.keys(files);
  spinnerProgress.start("比对哈希值", filenames.length);
  for (let i = 0; i < filenames.length; i += readBatchSize) {
    const batchFilenames = filenames.slice(i, i + readBatchSize);
    const wikiResponse = await wiki.request<MWResponseQueryImageInfoSha1>({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: batchFilenames.map(file => `File:${file}`).join("|"),
      iiprop: "sha1",
      iilimit: 1,
    });
    if (wikiResponse.error) {
      spinnerProgress.fail();
      console.error(wikiResponse.error);
      process.exit(1);
    }
    const remoteHashMap = Object.fromEntries(
      Object.values(wikiResponse.query.pages ?? {})
        .filter(page => page.imageinfo?.[0]?.sha1)
        .map(page => [page.title, page.imageinfo?.[0]?.sha1]),
    );
    const fileNormalizedMap = Object.fromEntries(
      wikiResponse.query.normalized
        ?.map(normalized => [normalized.from, normalized.to]) ?? [],
    );
    await Promise.all(batchFilenames.map(async (filename) => {
      const remoteHash = remoteHashMap[fileNormalizedMap[`File:${filename}`] ?? `File:${filename}`];
      if (!remoteHash) {
        filesChanged.push(filename);
        return;
      }
      const file = Bun.file(files[filename]!);
      const localHash = hasher.update(await file.arrayBuffer()).digest("hex");
      if (localHash !== remoteHash) {
        filesChanged.push(filename);
      }
    }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinnerProgress.increment(batchFilenames.length);
  }
  spinnerProgress.succeed();
  if (!filesChanged.length) {
    logger.infoGray("没有文件需要更新");
    process.exit(0);
  }

  logger.infoBlue(`以下${filesChanged.length}个文件需要更新：`);
  filesChanged.slice(0, 10).forEach((filename) => {
    logger.info(`  ${filename}`);
  });
  if (filesChanged.length > 10) {
    logger.infoGray(`...共${filesChanged.length - 10}个文件未显示`);
  }

  const confirmUpload = await confirm({ message: "是否上传至Wiki？" });
  if (!confirmUpload) {
    return;
  }

  spinnerProgress.start("上传至Wiki", filesChanged.length);
  for (const filename of filesChanged) {
    const file = Bun.file(files[filename]!);
    const { error } = await wiki.apiUpload(
      Buffer.from(await file.arrayBuffer()),
      filename,
      {
        comment: summary,
        text,
      },
    );
    if (error) {
      spinnerProgress.fail();
      console.error(`${filename} 上传失败`);
      console.error(error);
      process.exit(1);
    }
    await new Promise(resolve => setTimeout(resolve, 200));
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
}

interface MWResponseQueryImageInfoSha1 extends MWResponseBase {
  query: {
    normalized: {
      from: string;
      to: string;
    }[];
    pages: {
      [id: string]: MWPage & { imageinfo?: { sha1: string }[] };
    };
  };
}
