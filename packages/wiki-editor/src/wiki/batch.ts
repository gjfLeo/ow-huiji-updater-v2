import type { WikiLoginOptions } from "./login";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import destr from "destr";
import { logger, spinner, spinnerProgress } from "../utils/logger";
import { wikiLogin } from "./login";

type BatchGetPages
  = | { titles: string[] }
    | { namespace?: number; prefix?: string }
    | { category: string };

export async function wikiBatchGet(options: BatchGetPages & {
  loginOptions?: WikiLoginOptions;
  batchSize?: number;
}) {
  const { loginOptions, batchSize = 10, ...pages } = options;
  const wiki = await wikiLogin(loginOptions ?? { userType: "bot" });

  let titles: string[];

  if ("titles" in pages) {
    titles = pages.titles;
  }
  else if ("category" in pages) {
    spinner.start("获取分类下的页面列表");
    const categoryPageList = await wiki.getPageListByCategory(pages.category);
    titles = categoryPageList.pages.map(item => item.title);
    spinner.succeed(`${spinner.text} ${chalk.gray(`(${titles.length})`)}`);
  }
  else {
    spinner.start("获取页面列表");
    let allPageList = await wiki.apiQueryListAllPages({ ...pages });
    titles = allPageList.query.allpages.map(item => item.title);
    while (allPageList.continue) {
      await Bun.sleep(1000);
      allPageList = await wiki.apiQueryListAllPages(
        { ...pages },
        { continue: allPageList.continue.apcontinue },
      );
      titles.push(...allPageList.query.allpages.map(item => item.title));
    }
    spinner.succeed(`${spinner.text} ${chalk.gray(`(${titles.length})`)}`);
  }

  const pageContentMap: Record<string, string> = {};

  spinnerProgress.start("获取页面内容", titles.length);
  for (let i = 0; i < titles.length; i += batchSize) {
    const batchTitles = titles.slice(i, i + batchSize);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await wiki.getPageRawTextByTitles(batchTitles);
    Object.values(result)
      .forEach((page) => {
        pageContentMap[page.pageTitle] = page.content;
      });
    spinnerProgress.increment(batchTitles.length);
  }
  spinnerProgress.succeed();
  return pageContentMap;
}

export async function wikiBatchEdit(
  pages: Record<string, string>,
  options: {
    formatter?: (content: string) => string;
    compareByJson?: boolean;
    summary: string;
    readBatchSize?: number;
    replaceBy?: { namespace?: number; prefix?: string };
  },
) {
  const {
    formatter = content => content,
    compareByJson = false,
    summary,
    readBatchSize = 50,
    replaceBy,
  } = options;

  const wiki = await wikiLogin({ userType: "bot" });
  const pageTitles = Object.keys(pages);

  if (replaceBy) {
    const pagesToDelete: string[] = [];
    const allPages = await wiki.apiQueryListAllPages(replaceBy);
    allPages?.query.allpages.forEach((page) => {
      if (!pages[page.title]) {
        pagesToDelete.push(page.title);
      }
    });
    if (pagesToDelete.length) {
      logger.warn(`以下${pagesToDelete.length}个页面需要删除：`);
      pagesToDelete.forEach((pageTitle) => {
        logger.info(`  ${pageTitle}`);
      });
      const confirmDelete = await confirm({ message: "是否确认删除？", default: false });
      if (!confirmDelete) {
        logger.infoGray("已取消");
        return;
      }
      spinnerProgress.start("删除页面", pagesToDelete.length);
      for (const pageTitle of pagesToDelete) {
        await wiki.apiDelete(pageTitle);
        await Bun.sleep(1000);
        spinnerProgress.increment();
      }
      spinner.succeed();
    }
  }

  const pagesChanged: string[] = [];
  const pagesChangedOldContent: Record<string, string> = {};
  const pagesChangedNewContent: Record<string, string> = {};

  // const writeFilePromises: Promise<void>[] = [];

  // await fse.emptyDir(path.join(__dirname, "../../output/temp/batchEditCompare"));

  spinnerProgress.start("读取已存在页面", pageTitles.length);
  for (let i = 0; i < pageTitles.length; i += readBatchSize) {
    const batchTitles = pageTitles.slice(i, i + readBatchSize);
    const batchPages = await wiki.getPageRawTextByTitles(batchTitles);
    batchTitles.forEach((title) => {
      const wikiTitle = title.replaceAll("_", " ");
      const oldContent = batchPages[wikiTitle]?.content;
      const newContent = pages[title]!;
      if (oldContent) {
        if (compareByJson) {
          if (Bun.deepEquals(destr(oldContent), destr(newContent))) {
            return;
          }
        }
        else {
          if (formatter(oldContent).normalize("NFC") === formatter(newContent).normalize("NFC")) {
            return;
          }
        }
      }
      pagesChanged.push(title);
      pagesChangedNewContent[title] = newContent;

      if (oldContent) {
        pagesChangedOldContent[title] = oldContent;
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinnerProgress.increment(batchTitles.length);
  }
  // await Promise.all(writeFilePromises);
  spinnerProgress.succeed();

  if (!pagesChanged.length) {
    logger.infoGray("没有页面需要更新");
    return;
  }

  logger.infoBlue(`以下${pagesChanged.length}个页面需要更新：`);
  pagesChanged.slice(0, 10).forEach((pageTitle) => {
    logger.info(`  ${pageTitle}`);
  });
  if (pagesChanged.length > 10) {
    logger.infoGray(`...共${pagesChanged.length - 10}个页面未显示`);
  }

  const confirmUpload = await confirm({ message: "是否确认上传？", default: false });
  if (!confirmUpload) {
    const showCompare = await confirm({ message: "是否显示一条对比？", default: false });
    if (showCompare) {
      console.info(chalk.bgRed(pagesChangedOldContent[pagesChanged[0]!]));
      console.info(chalk.bgGreen(pagesChangedNewContent[pagesChanged[0]!]));
      await Bun.write(
        path.join(__dirname, "../../output/temp/batchEditCompare-old"),
        pagesChangedOldContent[pagesChanged[0]!]!,
      );
      await Bun.write(
        path.join(__dirname, "../../output/temp/batchEditCompare-new"),
        pagesChangedNewContent[pagesChanged[0]!]!,
      );
    }
    return;
  }

  spinnerProgress.start("上传页面", pagesChanged.length);
  const noChangePages: string[] = [];
  for (const title of pagesChanged) {
    const { edit, error } = await wiki.editPage(
      title,
      pagesChangedNewContent[title]!,
      { isBot: true, summary },
    );
    if (error) {
      spinnerProgress.fail();
      console.error(error);
      process.exit(1);
    }
    if (edit.nochange !== undefined) {
      noChangePages.push(title);
    }
    await Bun.sleep(1000);
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
  if (noChangePages.length) {
    logger.infoGray(`以下${noChangePages.length}个页面无变化：`);
    noChangePages.slice(0, 10).forEach((pageTitle) => {
      logger.infoGray(`  ${pageTitle}`);
    });
    if (noChangePages.length > 10) {
      logger.infoGray(`...共${noChangePages.length - 10}个页面未显示`);
    }
  }
}
