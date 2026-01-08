import path from "node:path";
import { input } from "@inquirer/prompts";
import { kebabCase, pascalCase } from "change-case";
import { findUp } from "find-up";
import fse from "fs-extra";
import { glob } from "tinyglobby";

export default async function createVuePackage() {
  const packageName = await input({
    message: "请输入包名：",
    pattern: /^[\w\-]+$/,
  });
  let normalizedName = packageName;
  normalizedName = normalizedName.replace(/^vue-?/i, "");
  const kebabCaseName = kebabCase(normalizedName);
  const pascalCaseName = pascalCase(normalizedName);

  const packagesPath = await findUp("packages", { cwd: __dirname, type: "directory" });
  if (!packagesPath) {
    console.error("未找到 packages 目录");
    process.exit(1);
  }

  const sandboxPackagePath = path.join(packagesPath, "vue-sandbox");
  if (!await fse.exists(sandboxPackagePath)) {
    console.error("未找到 vue-sandbox 目录");
    process.exit(1);
  }

  const targetPackagePath = path.join(packagesPath, `vue-${kebabCaseName}`);
  if (await fse.exists(targetPackagePath)) {
    console.error(`vue-${kebabCaseName} 已存在`);
    process.exit(1);
  }

  const files = await glob([
    path.posix.join("packages", "vue-sandbox", "**/*"),
    "!**/node_modules/**",
    "!**/dist/**",
  ]);

  await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await fse.readFile(filePath, "utf-8");
      const newFileContent = fileContent
        .replaceAll("sandbox", kebabCaseName)
        .replaceAll("Sandbox", pascalCaseName);
      const newFilePath = filePath.replace("vue-sandbox", `vue-${kebabCaseName}`);
      await fse.ensureDir(path.dirname(newFilePath));
      await fse.writeFile(newFilePath, newFileContent);
    }),
  );

  Bun.openInEditor(path.join(targetPackagePath, "src/Content.vue"));
}
