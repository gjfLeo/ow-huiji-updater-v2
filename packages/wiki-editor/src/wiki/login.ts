import chalk from "chalk";
import { HuijiWiki } from "huijiwiki-api";
import ora from "ora";

export async function wikiLogin(options: { userType?: "bot" | "developer" | "user" } = {}) {
  const { userType = "user" } = options;

  const prefix = process.env.HUIJI_PREFIX;
  const authKey = process.env.HUIJI_AUTH_KEY;

  let username: string | undefined;
  let password: string | undefined;
  switch (userType) {
    case "user":
      username = process.env.HUIJI_USERNAME;
      password = process.env.HUIJI_PASSWORD;
      break;
    case "bot":
      username = process.env.HUIJI_USERNAME_BOT;
      password = process.env.HUIJI_PASSWORD_BOT;
      break;
    case "developer":
      username = process.env.HUIJI_USERNAME_DEVELOPER;
      password = process.env.HUIJI_PASSWORD_DEVELOPER;
      break;
  }

  if (!username || !password || !authKey || !prefix) {
    console.error(chalk.red(`请配置登录信息 (${userType})`));
    process.exit(1);
  }

  const spinner = ora(`登录Wiki ${chalk.gray(username)}`).start();
  const wiki = new HuijiWiki(prefix, authKey, { logLevel: 20 });
  const loginSuccess = await wiki.apiLogin(username, password);
  if (!loginSuccess) {
    spinner.fail();
    process.exit(1);
  }
  spinner.succeed();

  return wiki;
}
