import path from "node:path";
import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import chokidar from "chokidar";
import dayjs from "dayjs";
import fse from "fs-extra";
import ora from "ora";
import { logger } from "../utils/logger";
import { getStorage, setStorage } from "../utils/storage";
import { wikiLogin } from "../wiki/login";

const OUTPUT_DIR = path.join(__dirname, "../../assets/pages");

export default async function editPage() {
  const lastEditPageTitle = await getStorage("lastEditPageTitle");
  const inputPageTitle = await input({
    message: "请输入Wiki页面标题：",
    validate: value => value.trim() ? true : "页面标题不能为空",
    default: lastEditPageTitle,
  });
  await setStorage("lastEditPageTitle", inputPageTitle);

  const spinner = ora();
  const wiki = await wikiLogin({ userType: "developer" });
  spinner.start("下载页面内容");
  const page = await wiki.getPageRawTextByTitle(inputPageTitle);
  spinner.succeed();

  if (!page) {
    const createPage = await confirm({ message: "页面不存在，是否创建？", default: true });
    if (!createPage) {
      process.exit(0);
    }
  }
  const pageTitle = page?.pageTitle ?? inputPageTitle;
  console.info(`${chalk.blue("  正在编辑： ")}https://overwatch.huijiwiki.com/wiki/${pageTitle}`);

  let localFilename = pageTitle.replaceAll(/[:/ ]/g, "_");
  const extension = getExtension(pageTitle, page?.contentmodel);
  if (!localFilename.endsWith(extension)) {
    localFilename += extension;
  }
  await fse.ensureDir(OUTPUT_DIR);
  const localFilepath = path.relative(process.cwd(), path.join(OUTPUT_DIR, localFilename));

  if (await fse.pathExists(localFilepath)) {
    // console.log(`文件路径：${chalk.gray(filePath)}`);
    const content = await fse.readFile(localFilepath, "utf-8");
    if (content !== page?.content) {
      const overwrite = await confirm({ message: "文件已存在，是否覆盖？", default: true });
      if (!overwrite) {
        process.exit(0);
      }
    }
  }
  await fse.writeFile(localFilepath, page?.content ?? "", "utf-8");
  console.info(`${chalk.blue("  文件已创建： ")}${localFilepath}`);
  Bun.openInEditor(localFilepath);

  async function checkAndUpload() {
    const timestamp = dayjs().format("HH:mm:ss");
    spinner.start(`${chalk.gray(timestamp)} 检查并上传`);
    const updatedContent = await fse.readFile(localFilepath, "utf-8");
    const page = await wiki.getPageRawTextByTitle(pageTitle);
    if (!updatedContent.trim() || updatedContent === page?.content) {
      spinner.info(chalk.gray(`${timestamp} 无需上传`));
      return;
    }
    const { edit, error: editError } = await wiki.editPage(
      pageTitle,
      updatedContent,
      { isBot: false },
    );
    if (editError) {
      spinner.fail();
      console.error(editError);
    }
    else {
      if (edit.nochange !== undefined) {
        spinner.info(chalk.gray(`${timestamp} 未改变`));
      }
      else {
        spinner.succeed(`${chalk.gray(timestamp)} 已上传 ${chalk.gray(edit.newrevid)}`);
      }
    }
  }

  // 持续监听文件变更
  chokidar.watch(localFilepath)
    .on("all", (event) => {
      if (event === "change") {
        checkAndUpload();
      }
    });

  process.on("SIGINT", async () => {
    console.info(chalk.gray("  停止监听"));

    // 询问是否删除本地文件
    const deleteFile = await confirm({
      message: "是否删除本地文件",
      default: true,
    });
    if (deleteFile) {
      await fse.remove(localFilepath);
    }
    process.exit(0);
  });

  // 保持程序运行
  await new Promise(() => {});
}

function getExtension(title: string, contentModel?: string) {
  if (!contentModel) {
    for (const extension of [".js", ".css", ".json", ".tabx"]) {
      if (title.endsWith(extension)) {
        return extension;
      }
    }
    if (title.startsWith("模块:") || title.startsWith("Module:")) return ".lua";
    if (title.startsWith("Html:")) return ".html";
    return ".wikitext";
  }
  switch (contentModel) {
    case "wikitext": return ".wikitext";
    case "GadgetDefinition": return ".json";
    case "HtmlMustache": return ".html";
    case "Scribunto": return ".lua";
    default:
      logger.warn(`未知的 contentmodel ${contentModel}，默认使用 wikitext`);
      return ".wikitext";
  }
}
