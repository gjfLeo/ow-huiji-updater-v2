import path from "node:path";
import { load } from "cheerio";
import dayjs from "dayjs";
import { ofetch } from "ofetch";
import z from "zod";
import { logger, spinnerProgress } from "../utils/logger";

const zNewsItem = z.object({
  title: z.string(),
  link: z.string(),
  date: z.string().optional(),
  summary: z.string(),
});

export default async function crawlNews() {
  {
    const news: z.infer<typeof zNewsItem>[] = [];
    spinnerProgress.start("获取中文新闻", Number.MAX_SAFE_INTEGER);
    const newsPage = await ofetch("https://ow.blizzard.cn/news/");
    const $ = load(newsPage);
    let listContent = $(".list-data-container").html();
    const totalPages = Number($("#total-pages").attr("value"));
    spinnerProgress.setTotal(totalPages);
    let currentPage = 1;
    while (currentPage <= totalPages) {
      $(".list-item-container", listContent).each((_, el) => {
        news.push(zNewsItem.parse({
          title: $(".content-title", el).html(),
          link: $(".fill-link", el).attr("href")!,
          date: $(".content-date", el).html() ? dayjs($(".content-date", el).html()).format("YYYY-MM-DD") : undefined,
          summary: $(".content-intro", el).html(),
        }));
      });
      currentPage++;
      spinnerProgress.increment();
      if (currentPage > totalPages) {
        break;
      }
      const nextPage = await ofetch(`https://ow.blizzard.cn/news/index_${currentPage}.html`);
      listContent = $(".list-data-container", nextPage).html();
    }
    spinnerProgress.succeed();

    const outputPath = path.resolve(__dirname, "../../output/news_zh.json");
    await Bun.write(
      outputPath,
      JSON.stringify(news, null, 2),
    );
    logger.success(path.relative(process.cwd(), outputPath));
  }

  {
    const news: z.infer<typeof zNewsItem>[] = [];
    spinnerProgress.start("获取英文新闻", 100);
    const newsPage = await ofetch("https://overwatch.blizzard.com/en-us/news/");
    const $ = load(newsPage);
    let listContent = $(".news-list .blz-list").html();
    let currentPage = -1;
    while (listContent) {
      $("a", listContent).each((_, el) => {
        const link = $(el).attr("href")!;
        news.push(zNewsItem.parse({
          title: $("[slot='heading']", el).html(),
          link: `https://overwatch.blizzard.com/en-us${link.replace(/undefined$/, "")}`,
          date: $(".date", el).html() ? dayjs($(".date", el).html()).format("YYYY-MM-DD") : undefined,
          summary: $(".article-summary", el).html(),
        }));
      });
      currentPage++;
      listContent = await ofetch("https://overwatch.blizzard.com/en-us/news/next-articles/", {
        query: { page: currentPage },
      });
      await Bun.sleep(200);
      spinnerProgress.increment();
    }
    spinnerProgress.succeed();

    const outputPath = path.resolve(__dirname, "../../output/news_en.json");
    await Bun.write(
      outputPath,
      JSON.stringify(news, null, 2),
    );
    logger.success(path.relative(process.cwd(), outputPath));
  }
}
