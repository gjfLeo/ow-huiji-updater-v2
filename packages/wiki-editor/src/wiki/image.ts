// Special:Redirect/file 不支持 format=original，所以直接使用拼接链接

import type { MWPage, MWResponseBase } from "huijiwiki-api/dist/HuijiWiki/typeMWApiResponse";
import { Buffer } from "node:buffer";
import { confirm } from "@inquirer/prompts";
import { ofetch } from "ofetch";
import sharp from "sharp";
import { logger, spinner, spinnerProgress } from "../utils/logger";
import { wikiBatchEdit } from "./batch";
import { wikiLogin } from "./login";

// const huijiImageUrl = "https://huiji-public.huijistatic.com/overwatch/uploads";
const fandomImageUrl = "https://static.wikia.nocookie.net/overwatch_gamepedia/images";

function getWikiImagePath(filename: string) {
  let normalizedName = filename.replaceAll(" ", "_");
  if (!normalizedName.includes(".")) {
    normalizedName += ".png";
  }
  const hash = new Bun.CryptoHasher("md5").update(normalizedName).digest("hex");
  return `${hash.slice(0, 1)}/${hash.slice(0, 2)}/${normalizedName}`;
}

export function getFandomImageUrl(filename: string) {
  return `${fandomImageUrl}/${getWikiImagePath(filename)}`;
}

export async function wikiUploadRemoteImage(
  url: string,
  filename: string,
  text?: string,
) {
  const remoteFile = await ofetch(url, {
    responseType: "arrayBuffer",
  });
  let fileBuffer: Buffer = Buffer.from(remoteFile);

  if (fileBuffer.length > 10 * 1024 * 1024) {
    const confirmCompress = await confirm({ message: "文件大小超过10MB，是否压缩？" });
    if (!confirmCompress) {
      process.exit(1);
    }
    fileBuffer = await compressImage(fileBuffer);
  }

  const wiki = await wikiLogin({ userType: "bot" });

  spinner.start("检查文件");
  const res = await wiki.getPageRawTextByTitle(`File:${filename}`);
  spinner.succeed();
  if (res) {
    const override = await confirm({ message: "文件已存在，是否覆盖？" });
    if (!override) {
      return;
    }
  }

  spinner.start("上传文件");
  const { upload, error } = await wiki.apiUpload(fileBuffer, filename, { text });
  if (error) {
    spinner.fail();
    console.error();
    process.exit(1);
  }
  spinner.succeed();
  return upload;
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
  const warnings: string[] = [];
  for (let i = 0; i < filenames.length; i += readBatchSize) {
    const batchFilenames = filenames.slice(i, i + readBatchSize);
    const wikiResponse = await wiki.request<MWResponseQueryImageInfoSha1>({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: batchFilenames.map(file => `File:${file}`).join("|"),
      iiprop: "sha1",
      iilimit: 1,
      redirects: 1,
    });
    if (wikiResponse.error) {
      spinnerProgress.fail();
      console.error(wikiResponse.error);
      process.exit(1);
    }
    const remoteTitleToHash = Object.fromEntries(
      Object.values(wikiResponse.query.pages ?? {})
        .filter(page => page.imageinfo?.[0]?.sha1)
        .map(page => [page.title, page.imageinfo?.[0]?.sha1]),
    );
    const titleNormalizeMap = Object.fromEntries(
      wikiResponse.query.normalized
        ?.map(normalized => [normalized.from, normalized.to]) ?? [],
    );
    const titleRedirectMap = Object.fromEntries(
      wikiResponse.query.redirects
        ?.map(redirect => [redirect.from, redirect.to]) ?? [],
    );
    await Promise.all(batchFilenames.map(async (filename) => {
      let remoteTitle = `File:${filename}`;
      let redirect = false;
      remoteTitle = titleNormalizeMap[remoteTitle] ?? remoteTitle;
      if (titleRedirectMap[remoteTitle]) {
        redirect = true;
        remoteTitle = titleRedirectMap[remoteTitle]!;
      }
      const remoteHash = remoteTitleToHash[remoteTitle];
      if (!remoteHash) {
        filesChanged.push(filename);
        return;
      }
      const file = Bun.file(files[filename]!);
      const localHash = hasher.update(await file.arrayBuffer()).digest("hex");
      if (localHash !== remoteHash) {
        if (redirect) {
          warnings.push(`${filename} 已被重定向到 ${remoteTitle}，且哈希值不一致。本次不会上传！`);
        }
        else {
          filesChanged.push(filename);
        }
      }
    }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinnerProgress.increment(batchFilenames.length);
  }
  spinnerProgress.succeed();
  if (warnings.length) {
    logger.warn("以下文件存在问题：");
    warnings.forEach((warning) => {
      logger.warn(`  ${warning}`);
    });
  }

  if (!filesChanged.length) {
    logger.infoGray("没有文件需要更新");
  }
  else {
    logger.infoBlue(`以下${filesChanged.length}个文件需要更新：`);
    filesChanged.slice(0, 10).forEach((filename) => {
      logger.info(`  ${filename}`);
    });
    if (filesChanged.length > 10) {
      logger.infoGray(`...共${filesChanged.length - 10}个文件未显示`);
    }

    const confirmUpload = await confirm({ message: "是否上传文件？" });
    if (!confirmUpload) {
      return;
    }

    spinnerProgress.start("上传文件", filesChanged.length);
    for (const filename of filesChanged) {
      const file = Bun.file(files[filename]!);
      const { error } = await wiki.apiUpload(
        Buffer.from(await file.arrayBuffer()),
        filename,
        { comment: summary, text },
      );
      if (error) {
        spinnerProgress.fail();
        console.error(`${filename} 上传失败`);
        console.error(error);
        process.exit(1);
      }
      await Bun.sleep(500);
      spinnerProgress.increment();
    }
    spinnerProgress.succeed();
  }

  const confirmUpdateText = await confirm({ message: "是否更新页面文字？" });
  if (confirmUpdateText) {
    await wikiBatchEdit(
      Object.fromEntries(Object.keys(files).map(filename => [`文件:${filename}`, text || ""])),
      {
        summary,
        skipRedirectPage: true,
      },
    );
  }
}

interface MWResponseQueryImageInfoSha1 extends MWResponseBase {
  query: {
    normalized: { from: string; to: string }[];
    redirects: { from: string; to: string }[];
    pages: {
      [id: string]: MWPage & { imageinfo?: { sha1: string }[] };
    };
  };
}

async function compressImage(fileBuffer: Buffer) {
  const input = sharp(fileBuffer);
  const metaData = await input.metadata();
  let targetWidth = metaData.width;
  if (metaData.width / metaData.height < 0.5) {
    targetWidth = Math.min(targetWidth, 1080);
  }
  else {
    targetWidth = Math.min(targetWidth, 3840);
  }
  return input
    .png({ compressionLevel: 9 })
    .resize(targetWidth)
    .toBuffer();
}
