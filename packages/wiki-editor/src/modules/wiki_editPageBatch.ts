import path from "node:path";
import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import chokidar from "chokidar";
import dayjs from "dayjs";
import fse, { ensureDir } from "fs-extra";
import { logger, spinner, spinnerProgress } from "../utils/logger";
import { wikiBatchGet } from "../wiki/batch";
import { wikiLogin } from "../wiki/login";

const OUTPUT_DIR = path.join(__dirname, "../../assets/pages/batch");

export default async function editPageBatch() {
  const selectBatchMode = await select({
    message: "请选择批量编辑模式：",
    choices: [
      { name: "按分类", value: "category" },
    ],
  });

  await ensureDir(OUTPUT_DIR);
  const fileNameToPageTitle: Record<string, string> = {};

  if (selectBatchMode === "category") {
    const inputCategory = await input({ message: "请输入分类名称：", default: "英雄" });
    const pages = await wikiBatchGet({ category: inputCategory });

    spinnerProgress.start("生成文件", Object.keys(pages).length);
    for (const [title, content] of Object.entries(pages)) {
      const fileName = `${title.replace(/[:/\s]/g, "_")}.wikitext`;
      fileNameToPageTitle[fileName] = title;
      const filePath = path.join(OUTPUT_DIR, fileName);
      await Bun.write(filePath, content);
      spinnerProgress.increment();
    }
    spinnerProgress.succeed();
    spinnerProgress.succeed(`生成文件 ${chalk.blue(path.relative(process.cwd(), OUTPUT_DIR))}`);
  }

  const wiki = await wikiLogin({ userType: "user" });

  async function checkAndUpload(pageTitle: string, filePath: string) {
    const timestamp = dayjs().format("HH:mm:ss");
    spinner.start(`${chalk.gray(timestamp)} 检查并上传 ${pageTitle}`);
    const updatedContent = await fse.readFile(filePath, "utf-8");
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
        spinner.info(chalk.gray(`${timestamp} ${pageTitle} 未改变`));
      }
      else {
        spinner.succeed(`${chalk.gray(timestamp)} ${pageTitle} 已上传 ${chalk.gray(edit.newrevid)}`);
      }
    }
  }
  chokidar.watch(OUTPUT_DIR)
    .on("all", (event, filePath) => {
      if (event === "change") {
        const fileName = path.basename(filePath);
        const pageTitle = fileNameToPageTitle[fileName];
        if (pageTitle) {
          checkAndUpload(pageTitle, filePath);
        }
      }
    });
  logger.infoGray("开始监听");

  process.on("SIGINT", async () => {
    logger.infoGray("停止监听");
    process.exit(0);
  });
}
