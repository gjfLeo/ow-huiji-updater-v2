import path from "node:path";
// import { wikiEditPage } from "@ow-huiji-updater/wiki-utils";
import chalk from "chalk";

const jsFile = Bun.file(path.join(__dirname, "../dist/Vue_Sandbox.js"));
const cssFile = Bun.file(path.join(__dirname, "../dist/Vue_Sandbox.css"));

// if (await jsFile.exists()) {
//   const { edit: jsEditResult, error: jsEditError } = await wikiEditPage({
//     title: "零件:Vue_Sandbox.js",
//     content: await jsFile.text(),
//     summary: "上传自ow-huiji-updater",
//     isDeveloper: true,
//   });
//   if (jsEditResult) {
//     const pageUrl = `https://overwatch.huijiwiki.com/wiki/${jsEditResult.title.replaceAll(" ", "_")}`;
//     const statusText = jsEditResult.nochange !== undefined ? "无变化" : "上传成功";
//     console.info(`Vue_Sandbox.js ${statusText} ${chalk.gray(pageUrl)}`);
//   }
//   else {
//     console.error("Vue_Sandbox.js 上传失败");
//     console.error(jsEditError);
//   }
// }

// if (await cssFile.exists()) {
//   const { edit: cssEditResult, error: cssEditError } = await wikiEditPage({
//     title: "零件:Vue_Sandbox.css",
//     content: await cssFile.text(),
//     summary: "上传自ow-huiji-updater",
//     isDeveloper: true,
//   });
//   if (cssEditResult) {
//     const pageUrl = `https://overwatch.huijiwiki.com/wiki/${cssEditResult.title.replaceAll(" ", "_")}`;
//     const statusText = cssEditResult.nochange !== undefined ? "无变化" : "上传成功";
//     console.info(`Vue_Sandbox.css ${statusText} ${chalk.gray(pageUrl)}`);
//   }
//   else {
//     console.error("Vue_Sandbox.css 上传失败");
//     console.error(cssEditError);
//   }
// }
