import type { RawMedia } from "./dataEvent_talonArchives";

import path from "node:path";
import fse from "fs-extra";
import z from "zod";
import rawMediaData from "../../assets/static/talon-archives-medias.json";
import rawData from "../../assets/static/talon-archives.json";
import { getImageFilename, MediaType, zTalonArchivesMediaDetail, zTalonArchivesRaw } from "./dataEvent_talonArchives";

export default async function parseTalonArchives() {
  const raw = zTalonArchivesRaw.parse(rawData);
  const mediaDetails = z.record(z.string(), zTalonArchivesMediaDetail).parse(rawMediaData);

  const pages: Record<string, string> = {};

  const outputDir = path.resolve(__dirname, "../../output/talon-archives/pages");
  await fse.emptyDir(outputDir);
  for (const [archiveId, archive] of Object.entries(raw["ccc-archives"])) {
    const name = archive.name;
    const relations = raw[`ccc-relation-${archiveId}`];

    if (archive.type === 5) {
      continue;
    }

    let content = "";

    if (archive.img_url) {
      content += `[[文件:黑爪档案_档案_${name}.png|thumb|${name}]]\n\n`;
    }

    // MARK: 档案简介
    if ((archive.type === 1 || archive.type === 2) && relations) {
      const briefRelations = relations.filter(relation => relation.table_name === "档案简介");
      content += "== 档案简介 ==\n";
      content += "=== 人物资料 ===\n";
      content += briefRelations[0]!.medium_content.split("\n").map(line => `* ${line}`).join("\n");
      content += "\n\n";
      if (briefRelations[1]?.medium_content) {
        content += "=== 简介 ===\n";
        content += briefRelations[1]!.medium_content.replaceAll(/\n+/g, "\n\n");
        content += "\n\n";
      }
      if (briefRelations[2]?.medium_content) {
        content += "=== 相关事件 ===\n";
        briefRelations[2]!.medium_content.matchAll(/<(\d+)>/g).forEach((match) => {
          const linkArchiveId = match[1]!;
          const linkArchive = raw["ccc-archives"][linkArchiveId]!;
          content += `* [[黑爪档案/${linkArchive.name}]]\n`;
        });
        content += "{{clear}}\n";
        content += "\n";
      }
    }

    // MARK: 档案正文
    if (relations) {
      content += "== 档案正文 ==\n";
      const contentRelations = relations.filter(relation => relation.table_name === "档案正文");
      contentRelations.forEach((relation) => {
        if (relation.table_title) {
          content += `=== ${relation.table_title} ===\n`;
        }
        if (relation.medium_id !== "-1") {
          if (relation.medium_id.includes(",")) {
            const mediaIds = relation.medium_id.split(",");
            const mediaFiles = mediaIds.map(mediumId => raw["ccc-medias"][mediumId]);
            if (mediaFiles.some(mediaFile => !mediaFile)) {
              console.error("Some media files not found: ", mediaFiles);
              return;
            }
            if (mediaFiles.some(mediaFile => mediaFile!.media_type !== MediaType.Audio)) {
              console.error("Multiple media types but not audios: ", mediaFiles);
              return;
            }
            content += "{{transcript|quote=1|\n";
            mediaFiles.forEach((mediaFile) => {
              const mediaDetail = mediaDetails[mediaFile!.id]!;
              const quoteContent = mediaDetail.media_name;
              const heroId = mediaDetail.tag_url;
              const heroName = raw["ccc-hero"][heroId]!.name;
              content += `* ${heroName}：${quoteContent}\n`;
            });
            content += "}}\n\n";
          }
          else {
            const mediaFile = raw["ccc-medias"][relation.medium_id];
            if (mediaFile) {
              content += renderMedia(mediaFile, true);
              content += "\n";
            }
            else {
              console.error(`medium_id ${relation.medium_id} not found`);
            }
          }
        }
        content += relation
          .medium_content
          .replaceAll(/\{([^{}]+)\}/g, "{{transcript|$1|quote=1}}")
          .replaceAll(/\n+/g, "\n\n")
          .replaceAll(/<(\d+)>/g, (match, linkId: string) => {
            if (linkId.startsWith("3")) {
              const linkArchive = raw["ccc-archives"][linkId]!;
              return `[[黑爪档案/${linkArchive.name}]]`;
            }
            else if (linkId.startsWith("4")) {
              const linkMedia = raw["ccc-medias"][linkId];
              if (linkMedia) {
                return renderMedia(linkMedia);
              }
            }
            return match;
          });
        content += "\n\n";
      });
    }

    switch (archive.type) {
      case 1:
        content += "[[分类:黑爪档案/主要人物]]";
        break;
      case 2:
        content += "[[分类:黑爪档案/次要人物]]";
        break;
      case 3:
        content += "[[分类:黑爪档案/主要事件]]";
        break;
      case 4:
        content += "[[分类:黑爪档案/其他事件]]";
        break;
    }

    pages[name] = content;
    await fse.writeFile(path.join(outputDir, `${name}.wikitext`), content);
  }
}

function renderMedia(media: RawMedia, isThumbnail = false) {
  let filename: string;
  switch (media.media_type) {
    case MediaType.Image:
      filename = getImageFilename(media.media_name, media.media_type);
      return isThumbnail ? `[[文件:${filename}|right|thumb|${media.media_name}]]` : `[[文件:${filename}|center|frame|${media.media_name}]]`;
    case MediaType.Record:
      return `[[黑爪档案/记录：${media.media_name}]]`;
    case MediaType.Video:
    case MediaType.Book:
    case MediaType.ShortStory:
      filename = getImageFilename(media.media_name, media.media_type);
      return isThumbnail ? `[[文件:${filename}|right|thumb|[[${media.media_name}]]|link=${media.media_name}]]` : `[[文件:${filename}|center|frame|[[${media.media_name}]]|link=${media.media_name}]]`;
    default:
      return `<!-- ${media.media_name} -->`;
  }
}
