// Special:Redirect/file 不支持 format=original，所以直接使用拼接链接
// const huijiImageUrl = "https://huiji-public.huijistatic.com/overwatch/uploads";
const fandomImageUrl = "https://static.wikia.nocookie.net/overwatch_gamepedia/images";

function getWikiImagePath(filename: string) {
  let normalizedName = filename.replaceAll("_", " ");
  if (!normalizedName.includes(".")) {
    normalizedName += ".png";
  }
  const hash = new Bun.CryptoHasher("md5").update(normalizedName).digest("hex");
  return `${hash.slice(0, 1)}/${hash.slice(0, 2)}/${normalizedName}`;
}

export function getFandomImageUrl(filename: string) {
  return `${fandomImageUrl}/${getWikiImagePath(filename)}`;
}
