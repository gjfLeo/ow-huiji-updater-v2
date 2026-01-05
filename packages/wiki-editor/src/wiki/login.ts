import chalk from "chalk";
import { HuijiWiki } from "huijiwiki-api";
import ora from "ora";

export async function wikiLogin(options: { developer?: boolean } = {}) {
  const { developer = false } = options;
  const username = developer ? process.env.HUIJI_DEVELOPER_USERNAME : process.env.HUIJI_USERNAME;
  const password = developer ? process.env.HUIJI_DEVELOPER_PASSWORD : process.env.HUIJI_PASSWORD;
  const authKey = process.env.HUIJI_AUTH_KEY;

  if (!username || !password || !authKey) {
    console.error(chalk.red(developer ? "请配置开发者登录信息" : "请配置用户登录信息"));
    process.exit(1);
  }

  const spinner = ora(`登录Wiki ${chalk.gray(username)}`).start();
  const wiki = new HuijiWiki("overwatch", authKey, { logLevel: 20 });
  const loginSuccess = await wiki.apiLogin(username, password);
  if (!loginSuccess) {
    spinner.fail();
    process.exit(1);
  }
  spinner.succeed();

  return wiki;
}
