import path from "node:path";

export function getFilenameFromUrl(url: string) {
  if (url.includes("?")) {
    url = url.split("?")[0]!;
  }
  url = url.replace(/\/revision\/\w+$/, "");
  return path.basename(url);
}

/**
 * 空格替换为下划线，首字母大写
 */
export function normalizeWikiFilename(filename: string, isPart?: boolean) {
  if (!isPart) {
    filename = filename.trim();
    filename = filename.replace(/^(文件|File):/, "");
  }
  filename = filename.replaceAll(" ", "_");
  filename = filename.charAt(0).toUpperCase() + filename.slice(1);
  return filename;
}
