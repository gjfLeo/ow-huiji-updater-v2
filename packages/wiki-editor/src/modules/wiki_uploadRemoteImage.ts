import { input } from "@inquirer/prompts";
import { wikiUploadRemoteImage } from "../wiki/image";

export default async function uploadRemoteImage() {
  const url = await input({
    message: "请输入图片URL：",
    validate: value => value.startsWith("http"),
  });
  const filename = await input({
    message: "请输入文件名：",
    validate: value => value.endsWith(".png") || value.endsWith(".jpg"),
  });
  const text = await input({ message: "请输入文件页面内容 (wikitext)：" });

  await wikiUploadRemoteImage(url, filename, text || undefined);
}
