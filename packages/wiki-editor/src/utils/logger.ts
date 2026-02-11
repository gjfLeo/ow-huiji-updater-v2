import type { Options, Params } from "cli-progress";
import chalk from "chalk";
import { Bar, Format } from "cli-progress";
import ora from "ora";

const spinnerOra = ora();

const progress = new Bar({
  fps: 25,
  hideCursor: true,
  stopOnComplete: true,
  clearOnComplete: true,
  format: (options: Options, params: Params) => {
    const barLength = options.barsize ?? 40;
    const completedLength = params.progress * barLength;
    const fullSquareLength = Math.floor(completedLength);
    const halfSquareLength = Math.round((completedLength - fullSquareLength) * 8);
    const halfSquareChar = ["", "\u258F", "\u258E", "\u258D", "\u258C", "\u258B", "\u258A", "\u2589", "\u2588"][halfSquareLength];
    const bar = chalk.gray.bgHex("#444")(`${"\u2588".repeat(fullSquareLength)}${halfSquareChar}`.padEnd(barLength, " "));

    const percentage = Format.ValueFormat(Math.floor(params.progress * 100), options, "percentage");
    const total = Format.ValueFormat(params.total, options, "total");
    const value = Format.ValueFormat(params.value, options, "value");

    return `${spinnerOra.frame()} ${bar} ${percentage}% | ${value}/${total}`;
  },
});

export const spinner = {
  get text() {
    return spinnerOra.text;
  },
  start(message: string) {
    spinnerOra.start(message);
  },
  succeed(message?: string) {
    spinnerOra.succeed(message);
  },
  fail(message?: string) {
    spinnerOra.fail(message);
  },
  info(message?: string) {
    spinnerOra.info(message);
  },
};

export const spinnerProgress = {
  start(message: string, total: number) {
    spinnerOra.text = message;
    progress.start(total, 0);
  },
  increment(value: number = 1) {
    progress.increment(value);
  },
  setTotal(total: number) {
    progress.setTotal(total);
  },
  succeed(message?: string) {
    progress.stop();
    spinnerOra.succeed(message);
  },
  fail(message?: string) {
    progress.stop();
    spinnerOra.fail(message);
  },
};

export const logger = {
  info(message: any) {
    console.info(`  ${message}`);
  },
  infoGray(message: any) {
    console.info(`  ${chalk.gray(message)}`);
  },
  infoBlue(message: any) {
    console.info(`  ${chalk.blue(message)}`);
  },
  success(message: any) {
    console.info(`  ${chalk.green(message)}`);
  },
  warn(message: any) {
    console.warn(`  ${chalk.yellow(message)}`);
  },
  error(message: any) {
    console.error(`  ${chalk.red(message)}`);
  },
};
