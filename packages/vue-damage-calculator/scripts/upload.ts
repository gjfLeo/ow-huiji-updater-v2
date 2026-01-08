import path from "node:path";
import chalk from "chalk";
import { HuijiWiki } from "huijiwiki-api";

const wiki = new HuijiWiki(process.env.HUIJI_PREFIX!, process.env.HUIJI_AUTH_KEY!, { logLevel: 20 });
await wiki.apiLogin(process.env.HUIJI_USERNAME_DEVELOPER!, process.env.HUIJI_PASSWORD_DEVELOPER!);

const jsFile = Bun.file(path.join(__dirname, "../dist/Vue_DamageCalculator.js"));
const cssFile = Bun.file(path.join(__dirname, "../dist/Vue_DamageCalculator.css"));

if (await jsFile.exists()) {
  const { edit: jsEditResult, error: jsEditError } = await wiki.apiEdit(
    "零件:Vue_DamageCalculator.js",
    await jsFile.text(),
    { summary: "上传自ow-huiji-updater" },
  );
  if (jsEditResult) {
    const pageUrl = `https://${process.env.HUIJI_PREFIX}.huijiwiki.com/wiki/${jsEditResult.title.replaceAll(" ", "_")}`;
    const statusText = jsEditResult.nochange !== undefined ? "无变化" : "上传成功";
    console.info(`Vue_DamageCalculator.js ${statusText} ${chalk.gray(pageUrl)}`);
  }
  else {
    console.error("Vue_DamageCalculator.js 上传失败");
    console.error(jsEditError);
  }
}

if (await cssFile.exists()) {
  const { edit: cssEditResult, error: cssEditError } = await wiki.apiEdit(
    "零件:Vue_DamageCalculator.css",
    await cssFile.text(),
    { summary: "上传自ow-huiji-updater" },
  );
  if (cssEditResult) {
    const pageUrl = `https://${process.env.HUIJI_PREFIX}.huijiwiki.com/wiki/${cssEditResult.title.replaceAll(" ", "_")}`;
    const statusText = cssEditResult.nochange !== undefined ? "无变化" : "上传成功";
    console.info(`Vue_DamageCalculator.css ${statusText} ${chalk.gray(pageUrl)}`);
  }
  else {
    console.error("Vue_DamageCalculator.css 上传失败");
    console.error(cssEditError);
  }
}
