import path from "node:path";
import { search } from "@inquirer/prompts";
import chalk from "chalk";
import fse from "fs-extra";
import Fuse from "fuse.js";
import ora from "ora";
import { getStorage, setStorage } from "./utils/storage";

interface WikiEditorModule {
  name: string;
  exec: () => Promise<void>;
}

const spinner = ora();

// #region 加载模块

spinner.start("加载模块");
const moduleFiles = await fse.readdir(path.join(__dirname, "modules"));
const modulePromises = moduleFiles
  .filter(file => file.endsWith(".ts"))
  .map<Promise<WikiEditorModule | null>>(async (file) => {
    const moduleName = file.replace(".ts", "");
    const module = await import(`./modules/${moduleName}`);
    if (!module.default) {
      console.warn(chalk.yellow(`Module ${moduleName} does not export a default function`));
      return null;
    }
    return {
      name: moduleName,
      exec: module.default,
    };
  });
const modules = (await Promise.all(modulePromises))
  .filter(module => module !== null)
  .toSorted((a, b) => a.name.localeCompare(b.name));
const fuse = new Fuse(modules, { keys: ["name"] });
spinner.succeed();

// #endregion

// #region 选择操作

const lastOperation = await getStorage("lastOperation");
const operation = await search(
  {
    message: "请选择操作：",
    source: (term) => {
      if (!term) {
        const choices = modules
          .map(module => ({ name: module.name, value: module.name }));
        const lastChoice = choices.find(choice => choice.value === lastOperation);
        if (lastChoice) {
          lastChoice.name += ` ${chalk.gray("(上次操作)")}`;
          choices.unshift(lastChoice);
        }
        return choices;
      }
      else {
        const results = fuse.search(term);
        const choices = results.map(result => ({ name: result.item.name, value: result.item.name }));
        const lastChoice = choices.find(choice => choice.value === lastOperation);
        if (lastChoice) {
          lastChoice.name += ` ${chalk.gray("(上次操作)")}`;
        }
        return choices;
      }
    },
  },
).catch((error) => {
  if (error instanceof Error) {
    if (error.name === "AbortPromptError" || error.name === "ExitPromptError") {
      console.info(chalk.gray("  已取消"));
      process.exit(0);
    }
  }
  throw error;
});
await setStorage("lastOperation", operation);

// #endregion

// #region 执行操作

const displayModulePath = path.relative(
  process.cwd(),
  path.join(__dirname, "modules", `${operation}.ts`),
);
console.info(chalk.gray(`  执行模块: ${displayModulePath}`));
try {
  await modules.find(module => module.name === operation)!.exec();
}
catch (error) {
  if (error instanceof Error) {
    if (error.name === "AbortPromptError" || error.name === "ExitPromptError") {
      console.info(chalk.gray("  已取消"));
      process.exit(0);
    }
  }
  console.error(chalk.red(`  执行模块 ${operation} 失败`), error);
  process.exit(1);
}

// #endregion
