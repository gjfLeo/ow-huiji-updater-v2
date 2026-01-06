import { Buffer } from "node:buffer";
import { confirm, input } from "@inquirer/prompts";
import { ofetch } from "ofetch";
import ora from "ora";
import { getFandomImageUrl } from "../wiki/image";
import { wikiLogin } from "../wiki/login";

export default async function copyFandomImage() {
  const filename = await input({
    message: "请输入Fandom文件名：",
    transformer: (value, { isFinal }) => {
      return normalizeFilename(value, isFinal);
    },
  });
  const normalizedName = normalizeFilename(filename, true);

  const spinner = ora("下载文件").start();
  const file = await ofetch(
    getFandomImageUrl(normalizedName),
    {
      query: { format: "original" },
      responseType: "arrayBuffer",
    },
  ).catch((error) => {
    spinner.fail();
    console.error(error);
    process.exit(1);
  });
  spinner.succeed();

  const confirmUpload = await confirm({ message: "是否上传？" });
  if (!confirmUpload) {
    return;
  }

  const targetFilename = await input({
    message: "请输入目标文件名：",
    default: normalizedName,
  });

  const wiki = await wikiLogin();

  // TODO 描述、分类

  spinner.start("上传文件");
  const { upload, error } = await wiki.apiUpload(
    Buffer.from(file),
    targetFilename,
    { comment: "上传文件，来源于fandom", text: `[[:en:File:${normalizedName}]]` },
  );
  if (upload) {
    spinner.succeed();
  }
  else {
    spinner.fail("上传失败");
    console.error(error);
    process.exit(1);
  }
}

function normalizeFilename(filename: string, isFinal?: boolean) {
  filename = filename.replaceAll(" ", "_");
  if (isFinal) {
    filename = filename.trim();
    if (!filename.includes(".")) {
      filename += ".png";
    }
  }
  return filename;
}
