import type { MWPage, MWResponseBase } from "huijiwiki-api/dist/HuijiWiki/typeMWApiResponse";
import { Buffer } from "node:buffer";
import path from "node:path";
import { URL } from "node:url";
import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import { fileTypeFromBuffer } from "file-type";
import { ofetch } from "ofetch";
import { wikiLogin } from "../export";
import { getFilenameFromUrl, normalizeWikiFilename } from "../utils/image";
import { logger, spinner } from "../utils/logger";

export default async function uploadFandomImage() {
  let fandomFilename = await input({
    message: "请输入Fandom文件名：",
    required: true,
    transformer: (value, { isFinal }) => {
      return normalizeWikiFilename(value, !isFinal);
    },
  });
  fandomFilename = normalizeWikiFilename(fandomFilename);

  // MARK: 获取重定向URL

  spinner.start("获取重定向URL");
  const res = await ofetch.raw(
    `https://overwatch.fandom.com/wiki/Special:Redirect/file/${fandomFilename}`,
    {
      redirect: "manual",
      ignoreResponseError: true,
    },
  );
  if (res.status === 404) {
    spinner.succeed();
    logger.warn("文件不存在");
    return uploadFandomImage();
  }
  if (res.status !== 301) {
    spinner.fail();
    logger.error("获取重定向URL失败");
    logger.error(`${res.status} ${res.statusText}`);
    console.error(res);
    return;
  }
  const redirectUrl = res.headers.get("location");
  if (!redirectUrl) {
    logger.error("获取重定向URL失败");
    return;
  }
  spinner.succeed();

  const actualFilename = getFilenameFromUrl(redirectUrl);
  const fileExtension = path.extname(actualFilename);

  // MARK: 下载文件

  const url = new URL(redirectUrl);
  url.searchParams.set("format", "original");
  logger.infoGray(url.toString());

  spinner.start("下载文件");
  const file = await ofetch(url.toString(), { responseType: "arrayBuffer" });
  spinner.succeed();

  // MARK: 检查文件类型

  const fileType = await fileTypeFromBuffer(file);
  const actualFileExtension = fileType?.ext ? `.${fileType.ext}` : fileExtension;
  if (!fileType || actualFileExtension !== fileExtension.toLowerCase()) {
    logger.warn(`目标文件的实际类型 ${fileType?.mime || "未知"} 与扩展名 ${fileExtension} 不一致`);
    const confirmMismatchFormat = await confirm({
      message: "是否继续？",
      default: false,
      theme: { prefix: { idle: chalk.yellow("!") } },
    });
    if (!confirmMismatchFormat) {
      return;
    }
  }

  let targetFilename = await input({
    message: "请输入目标文件名：",
    default: actualFilename,
    required: true,
    transformer: (value, { isFinal }) => {
      return normalizeWikiFilename(value, !isFinal);
    },
    validate: (value) => {
      if (value.includes(".") && !value.endsWith(actualFileExtension)) {
        return `扩展名必须为 ${actualFileExtension}`;
      }
      return true;
    },
  });
  targetFilename = normalizeWikiFilename(targetFilename);
  if (!targetFilename.endsWith(actualFileExtension)) {
    targetFilename += actualFileExtension;
  }

  // MARK: 检查已存在文件

  const wiki = await wikiLogin();

  const page = await wiki.getPageRawTextByTitle(`文件:${targetFilename}`);
  if (page) {
    if (page.content.includes("#重定向") || page.content.includes("#redirect")) {
      logger.warn("页面已存在，并且是重定向页面");
      return;
    }

    const imageInfo = await wiki.request<MWResponseQueryImageInfoSha1>({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: `File:${targetFilename}`,
      iiprop: "sha1",
      iilimit: 1,
    });

    const downloadedSha1 = new Bun.CryptoHasher("sha1").update(Buffer.from(file)).digest("hex");
    const existedSha1 = Object.values(imageInfo.query.pages)[0]?.imageinfo?.[0]?.sha1;
    if (existedSha1 === downloadedSha1) {
      logger.warn("文件已存在，且SHA1值一致");
      const confirmEdit = await confirm({ message: "是否编辑已存在的页面？" });
      if (!confirmEdit) {
        return;
      }
      // TODO: 编辑页面
      return;
    }
    else {
      const confirmOverride = await confirm({
        message: "是否覆盖已存在的文件？",
        default: false,
        theme: { prefix: { idle: chalk.yellow("!") } },
      });
      if (!confirmOverride) {
        return;
      }
    }
  }

  // MARK: 上传文件

  const text = await input({
    message: "请输入页面内容（wikitext）：",
  });
  spinner.start("上传文件");
  await wiki.apiUpload(Buffer.from(file), targetFilename, {
    comment: "上传来自Fandom的文件（ow-huiji-updater）",
    text: text || undefined,
  });
  spinner.succeed();
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
