import path from "node:path";

import fse from "fs-extra";
import { ofetch } from "ofetch";
import rawData from "../../assets/static/talon-archives.json";

export default async function getTalonArchivesMedias() {
  const medias: Record<string, any> = {};
  for (const archiveId of Object.keys(rawData["ccc-archives"])) {
    const res = await ofetch("https://webapi.blizzard.cn/ow-talonarchives/medias/", {
      query: {
        archives_id: archiveId,
      },
      headers: {
        cookie: `ow_user_info=${process.env.COOKIE_OW_USER_INFO}`,
      },
    });
    res.data.medias
      .forEach((item: any) => {
        if (item.status === 1) {
          console.error(item);
        }
        medias[item.media_id] = item;
      });
  }
  await fse.writeJSON(
    path.join(__dirname, "../../assets/data/stubs/talon-archives-medias.json"),
    Object.fromEntries(
      Object.entries(medias)
        .toSorted((a, b) => a[0].localeCompare(b[0])),
    ),
    { spaces: 2 },
  );
}
