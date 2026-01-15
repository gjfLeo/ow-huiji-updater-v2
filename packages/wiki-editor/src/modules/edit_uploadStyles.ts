import path from "node:path";
import chalk from "chalk";
import chokidar from "chokidar";
import destr from "destr";
import { compileString } from "sass";
import { logger } from "../utils/logger";
import { wikiLogin } from "../wiki/login";

export default async function uploadStyles() {
  const wiki = await wikiLogin({ userType: "developer" });

  const gadgetDefinitionPage = await wiki.getPageRawTextByTitle("Gadget_definition:Styles");
  if (!gadgetDefinitionPage) {
    console.error(chalk.red("Gadget_definition:Styles 不存在"));
    process.exit(1);
  }
  const gadgetDefinition = destr(gadgetDefinitionPage.content) as { module: { styles: string[] } };

  async function compileAndUpload(scssFilepath: string) {
    const scssContent = await Bun.file(scssFilepath).text();
    if (scssContent.length === 0) {
      return;
    }
    const cssContent = compileString(scssContent, { sourceMap: false }).css;
    // await fs.promises.writeFile(scssFilepath.replace(".scss", ".css"), cssContent);

    const cssFilename = path.basename(scssFilepath).replace(".scss", ".css");
    if (!gadgetDefinition.module.styles.includes(cssFilename)) {
      gadgetDefinition.module.styles.push(cssFilename);
      gadgetDefinition.module.styles.sort();
      await wiki.editPage(
        "Gadget_definition:Styles",
        JSON.stringify(gadgetDefinition),
        { summary: "ow-huiji-updater 上传" },
      );
    }
    const { edit, error } = await wiki.apiEdit(
      `Gadget:${cssFilename}`,
      cssContent,
      { summary: "ow-huiji-updater 上传" },
    );
    if (edit) {
      if (edit.nochange !== undefined) {
        logger.infoGray(`${cssFilename} 无变化`);
      }
      else {
        logger.success(`${cssFilename} 上传成功`);
      }
    }
    else {
      logger.error(`${cssFilename} 上传失败`);
      console.error(JSON.stringify(error));
    }
  }

  chokidar.watch(path.resolve(__dirname, "../../assets/styles"))
    .on("all", (event, filePath) => {
      if (filePath.endsWith(".scss") && event === "change") {
        compileAndUpload(filePath);
      }
    });
  logger.infoGray("开始监听");

  process.on("SIGINT", async () => {
    logger.infoGray("停止监听");
    process.exit(0);
  });
}
