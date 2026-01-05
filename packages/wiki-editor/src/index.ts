import path from "node:path";
import { search } from "@inquirer/prompts";
import chalk from "chalk";
import fse from "fs-extra";
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
  .filter(module => module !== null);
spinner.succeed();

// #endregion

// #region 选择操作

const lastOperation = await getStorage("lastOperation");
const operation = await search(
  {
    message: "请选择操作：",
    source: (term) => {
      return modules
        .filter(module => module.name.toLowerCase().includes(term?.toLowerCase() || ""))
        .map((module) => {
          const choice = {
            name: module.name,
            value: module.name,
            isLastOperation: module.name === lastOperation,
          };
          if (module.name === lastOperation) {
            choice.name += ` ${chalk.gray("(上次操作)")}`;
          }
          return choice;
        })
        .sort((a, b) => {
          if (!term) {
            if (a.isLastOperation) return -1;
            if (b.isLastOperation) return 1;
          }
          return a.value.localeCompare(b.value);
        });
    },
  },
  // { clearPromptOnDone: false },
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

const displayModulePath = path.relative(process.cwd(), path.join(__dirname, "modules", `${operation}.ts`));
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
  console.error(chalk.red(`Failed to execute module ${operation}`), error);
  process.exit(1);
}
