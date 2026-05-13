import type { OwlibArcadeMode } from "../utils/owlib/miscs";
import path from "node:path";
import { emptyDir, ensureDir, link } from "fs-extra";
import PQueue from "p-queue";
import sharp from "sharp";
import { convertPathToPattern, glob } from "tinyglobby";
import z from "zod";
import { OUTPUT_DIR, OWLIB_EXTRACT_DIR, OWLIB_UI_TEXTURE_DIR } from "../constants/paths";
import { readStrings } from "../utils/data";
import { logger, spinnerProgress } from "../utils/logger";
import { GUIDType, readOwlibHeroList, readOwlibUnlockList } from "../utils/owlib";
import { readOwlibArcadeModeList, readOwlibEsportsTeamList, readOwlibLootBoxList } from "../utils/owlib/miscs";
import { readOwlibTalentList } from "../utils/owlib/talents";

const _TextureInfoSchema = z.object({
  id: z.string(),
  idN: z.number(),
  hash: z.string(),
  resolution: z.string(),
  outputs: z.array(z.object({
    outputPath: z.string(),
    outputName: z.string(),
    lowPriority: z.boolean().optional(),
  })),
});
type TextureInfo = z.infer<typeof _TextureInfoSchema>;

export default async function owlib_analyzeImages() {
  const textureInfoById: Record<string, TextureInfo> = {};
  const textureInfoByHash: Record<string, TextureInfo> = {};
  const { zhStrings } = await readStrings();

  const hasher = new Bun.CryptoHasher("sha1");
  const getFileData = async (path: string) => {
    const file = Bun.file(path);
    const data = await file.arrayBuffer();
    const hash = hasher.update(data).digest("hex");
    return { data, hash };
  };

  // MARK: 读取所有图片文件
  {
    spinnerProgress.start("读取所有图片文件", 0);
    const textureFiles = await glob(convertPathToPattern(path.join(OWLIB_UI_TEXTURE_DIR, "*.png")));
    spinnerProgress.setTotal(textureFiles.length);

    const queue = new PQueue({ concurrency: 10 });
    const handleTexture = async (texturePath: string) => {
      const id = path.basename(texturePath, ".png");
      const idN = Number.parseInt(id, 16);
      if (Number.isNaN(idN)) {
        return;
      }
      const { data, hash } = await getFileData(texturePath);
      const { width, height } = await sharp(data).metadata();
      const textureInfo: TextureInfo = /* TextureInfoSchema.parse */({
        id,
        idN,
        hash,
        resolution: `${width}x${height}`,
        outputs: [],
      });
      textureInfoById[id] = textureInfo;
      textureInfoByHash[hash] = textureInfo;
    };
    textureFiles.forEach((texturePath) => {
      queue.add(async () => {
        try {
          await handleTexture(texturePath);
        }
        catch (error) {
          spinnerProgress.pause(() => {
            logger.error(`\n图片处理失败 ${path.basename(texturePath)}`);
            console.error(error);
          });
        }
        finally {
          spinnerProgress.increment();
        }
      });
    });
    await queue.onIdle();
    spinnerProgress.succeed();
  }

  // MARK: extract
  {
    async function handleExtractedImages(options: {
      globPattern: string;
      parseInfo: (pathParts: string[], textureInfo: TextureInfo) => {
        outputPath: string;
        outputName: string;
        lowPriority?: boolean;
      };
    }) {
      const { globPattern, parseInfo } = options;
      spinnerProgress.start(`处理提取的图片 ${globPattern}`, 0);

      const queue = new PQueue({ concurrency: 10 });
      const handleFile = async (filePath: string) => {
        const fullPath = path.resolve(OWLIB_EXTRACT_DIR, filePath);
        const { hash } = await getFileData(fullPath);
        const pathParts = filePath.substring(0, filePath.length - 4).split("/");

        const textureInfo = textureInfoByHash[hash];
        if (!textureInfo) {
          // spinnerProgress.pause(() => {
          //   logger.error(`\n图片匹配失败 ${path.basename(filePath)}`);
          //   console.error({ filePath, hash });
          // });
          return;
        }

        const output = parseInfo(pathParts, textureInfo);
        textureInfo.outputs.push(output);
      };

      const filePaths = await glob(convertPathToPattern(globPattern), { cwd: OWLIB_EXTRACT_DIR });
      spinnerProgress.setTotal(filePaths.length);
      filePaths.forEach((filePath) => {
        queue.add(async () => {
          await handleFile(filePath);
          spinnerProgress.increment();
        });
      });
      await queue.onIdle();
      spinnerProgress.succeed();
    }

    const listUnlocks = await readOwlibUnlockList();

    // 喷漆（英雄）
    await handleExtractedImages({
      globPattern: "Heroes/*/Spray/*/*.png",
      parseInfo: (pathParts) => {
        const [_HEROES, heroString, _SPRAY, unlockCategoryString, nameString]
          = pathParts as ["Heroes", string, "Spray", string, string];
        const hero = zhStrings[heroString]!;
        const unlockCategory = zhStrings[unlockCategoryString]!;
        const name = zhStrings[nameString]!;
        const unlock = listUnlocks.find(item => item.Name === nameString)!;
        return {
          outputPath: `个性化物品/喷漆/英雄/${hero}/${unlockCategory}`,
          outputName: generateImageFileName("喷漆", hero, name, getShortGuid(unlock.GUID, 4)),
        };
      },
    });

    // 喷漆（通用）
    await handleExtractedImages({
      globPattern: "Sprays/Spray/*/*.png",
      parseInfo: (pathParts) => {
        const [_1, _2, unlockCategoryString, nameString]
          = pathParts as ["Sprays", "Spray", string, string];
        const unlockCategory = zhStrings[unlockCategoryString]!;
        const name = zhStrings[nameString]!;
        const unlock = listUnlocks.find(item => item.Name === nameString)!;
        return {
          outputPath: `个性化物品/喷漆/通用/${unlockCategory}`,
          outputName: generateImageFileName("喷漆", name, getShortGuid(unlock.GUID, 4)),
        };
      },
    });

    // 名牌
    await handleExtractedImages({
      globPattern: "NameCards/NameCard/*/*.png",
      parseInfo: (pathParts) => {
        const [_1, _2, unlockCategoryString, nameString]
          = pathParts as ["NameCards", "NameCard", string, string];
        const unlockCategory = zhStrings[unlockCategoryString]!;
        const name = zhStrings[nameString]!;
        if (!name) {
          return {
            outputPath: `个性化物品/名牌/${unlockCategory}`,
            outputName: generateImageFileName("名牌", name, `${nameString}.${GUIDType.String}`),
          };
        }
        const unlock = listUnlocks.find(item => item.Name === nameString)!;
        return {
          outputPath: `个性化物品/名牌/${unlockCategory}`,
          outputName: generateImageFileName("名牌", name, getShortGuid(unlock.GUID, 4)),
        };
      },
    });

    // 头像
    await handleExtractedImages({
      globPattern: "PlayerIcons/Icon/*/*.png",
      parseInfo: (pathParts) => {
        const [_1, _2, unlockCategoryString, nameString]
          = pathParts as ["PlayerIcons", "Icon", string, string];
        const unlockCategory = zhStrings[unlockCategoryString]!;
        const name = zhStrings[nameString]!;
        const unlock = listUnlocks.find(item => item.Name === nameString)!;
        return {
          outputPath: `个性化物品/头像/${unlockCategory}`,
          outputName: generateImageFileName("头像", name, getShortGuid(unlock.GUID, 4)),
        };
      },
    });

    // UI/等级头像框
    await handleExtractedImages({
      globPattern: "General/PortraitFrame/*/*.png",
      parseInfo: (pathParts) => {
        const [_GENERAL, _PORTRAITFRAME, rank, name]
          = pathParts as ["General", "PortraitFrame", string, string];
        return {
          outputPath: "UI/等级头像框",
          outputName: generateImageFileName(rank, name),
        };
      },
    });

    await handleExtractedImages({
      globPattern: "HeroIcons/*/*.png",
      parseInfo: (pathParts) => {
        const [_1, heroName, textureGuid]
          = pathParts as ["HeroIcons", string, string];
        return {
          outputPath: `英雄/其他/${heroName}`,
          outputName: generateImageFileName(textureGuid),
          lowPriority: true,
        };
      },
    });

    await handleExtractedImages({
      globPattern: "IntelDatabase/Textures/*.png",
      parseInfo: (pathParts) => {
        const [_1, _2, textureGuid]
          = pathParts as ["IntelDatabase", "Textures", string];
        return {
          outputPath: "UI/行动任务数据库",
          outputName: generateImageFileName(textureGuid),
        };
      },
    });
  }

  // MARK: list
  {
    async function handleList<T>(options: {
      name: string;
      list: T[];
      handleItem: (item: T) => Promise<void> | void;
    }) {
      const { name, list, handleItem } = options;
      spinnerProgress.start(`处理${name}列表`, 0);
      spinnerProgress.setTotal(list.length);
      for (const item of list) {
        await handleItem(item);
        spinnerProgress.increment();
      }
      spinnerProgress.succeed();
    }

    await handleList({
      name: "英雄",
      list: (await readOwlibHeroList()).filter(item => item.IsHero),
      handleItem: async (hero) => {
        hero.Images.forEach((image) => {
          if (!image.TextureGUID) return;
          const textureInfo = textureInfoById[getShortGuid(image.TextureGUID)];
          if (!textureInfo) return;
          switch (image.Id) {
            case "0000000040C7.01C":
              textureInfo.outputs.push({
                outputPath: "英雄/头像/3D",
                outputName: generateImageFileName(hero.Name!, "头像_3D"),
              });
              break;
            case "0000000040C8.01C":
              textureInfo.outputs.push({
                outputPath: "英雄/头像/游戏内",
                outputName: generateImageFileName(hero.Name!, "头像_游戏内"),
              });
              break;
            case "0000000040C9.01C":
              textureInfo.outputs.push({
                outputPath: "英雄/头像/2D",
                outputName: generateImageFileName(hero.Name!, "头像_2D"),
              });
              break;
            case "000000010297.01C":
              textureInfo.outputs.push({
                outputPath: "英雄/头像/剪影",
                outputName: generateImageFileName(hero.Name!, "头像_剪影"),
              });
              break;
            case "0000000040CA.01C":
            case "0000000040D2.01C":
              textureInfo.outputs.push({
                outputPath: `英雄/头像/${image.Id}`,
                outputName: generateImageFileName(hero.Name!, "头像", image.Id),
              });
              break;
            default:
              textureInfo.outputs.push({
                outputPath: `英雄/${image.Id}`,
                outputName: generateImageFileName(hero.Name!),
              });
              break;
          }
        });
        hero.Loadouts?.forEach((loadout) => {
          if (!loadout.TextureGUID) return;
          const textureInfo = textureInfoById[loadout.TextureGUID?.substring(0, 12)];
          if (!textureInfo) return;
          textureInfo.outputs.push({
            outputPath: "英雄/技能",
            outputName: generateImageFileName(hero.Name!, loadout.Name, "图标"),
          });
        });
        hero.Perks?.forEach((loadout) => {
          if (!loadout.TextureGUID) return;
          const textureInfo = textureInfoById[loadout.TextureGUID?.substring(0, 12)];
          if (!textureInfo) return;
          textureInfo.outputs.push({
            outputPath: "英雄/威能",
            outputName: generateImageFileName(hero.Name!, loadout.Name, "图标"),
          });
        });
      },
    });
    await handleList({
      name: "非英雄",
      list: (await readOwlibHeroList()).filter(item => !item.IsHero),
      handleItem: async (hero) => {
        hero.Images.forEach((image) => {
          if (!image.TextureGUID) return;
          const textureInfo = textureInfoById[getShortGuid(image.TextureGUID)];
          if (!textureInfo) return;
          textureInfo.outputs.push({
            outputPath: "非英雄",
            outputName: generateImageFileName(hero.Name!, image.Id, textureInfo.id),
          });
        });
      },
    });

    {
      const stadiumCategoryNames = {
        "00000000ECC7.01C": "异能",
        "0000000068D3.01C": "物品/武器",
        "000000005FDC.01C": "物品/技能",
        "00000000ECD2.01C": "物品/生存",
        "0000000002BB.01C": "物品/装置",
      };
      await handleList({
        name: "天赋",
        list: await readOwlibTalentList(),
        handleItem: async (talent) => {
          if (!talent.TextureGUID) return;
          const textureInfo = textureInfoById[talent.TextureGUID?.substring(0, 12)];
          if (!textureInfo) return;

          if (talent.TalentType === "Talent") {
            if (talent.Category?.GUID && talent.Category.GUID in stadiumCategoryNames) {
              const categoryName = stadiumCategoryNames[talent.Category.GUID as keyof typeof stadiumCategoryNames]!;
              textureInfo.outputs.push({
                outputPath: `英雄/角斗领域/${categoryName}`,
                outputName: generateImageFileName(talent.Hero?.Value ?? "通用", talent.Name!),
              });
              return;
            }
            if (talent.Name.endsWith("面具") || talent.GUID === "000000002757.134") {
              textureInfo.outputs.push({
                outputPath: "英雄/天赋/鬼魅假面舞会",
                outputName: generateImageFileName(talent.Name!),
              });
              return;
            }
            textureInfo.outputs.push({
              outputPath: "英雄/天赋",
              outputName: generateImageFileName(getNumberId(talent.GUID, 6), talent.Hero?.Value ?? "~", talent.Name!),
            });
            return;
          }

          if (talent.TalentType === "Perk") {
            textureInfo.outputs.push({
              outputPath: "英雄/威能",
              outputName: generateImageFileName(talent.Hero?.Value ?? "~", talent.Name!, "图标"),
            });
          }
        },
      });
    }

    {
      const listArcadeModes = await readOwlibArcadeModeList();
      const handleArcadeMode = (arcadeMode: OwlibArcadeMode, parentName?: string) => {
        if (!arcadeMode.Image) return;
        if (listArcadeModes.find(t => t.Children?.includes(arcadeMode.GUID)) && !parentName) return;
        const textureInfo = textureInfoById[arcadeMode.Image?.substring(0, 12)];
        if (!textureInfo) return;
        const name = [parentName, arcadeMode.Name!].filter(Boolean).join("_");
        textureInfo.outputs.push({
          outputPath: "UI/街机模式",
          outputName: generateImageFileName(name, getShortGuid(arcadeMode.GUID, 4)),
        });
        if (arcadeMode.Children) {
          arcadeMode.Children.forEach((child) => {
            handleArcadeMode(listArcadeModes.find(t => t.GUID === child)!, name);
          });
        }
      };
      await handleList({
        name: "街机模式",
        list: listArcadeModes,
        handleItem: handleArcadeMode,
      });
    }

    await handleList({
      name: "补给箱",
      list: await readOwlibLootBoxList(),
      handleItem: async (lootBox) => {
        lootBox.ShopCards?.forEach((card) => {
          const textureInfo = textureInfoById[getShortGuid(card.Texture)];
          if (!textureInfo) return;
          const name = lootBox.NameFormat.substring(lootBox.NameFormat.lastIndexOf("份") + 1);
          textureInfo.outputs.push({
            outputPath: `UI/补给箱/${name}`,
            outputName: generateImageFileName(card.Text),
          });
        });
      },
    });

    await handleList({
      name: "战队",
      list: await readOwlibEsportsTeamList(),
      handleItem: async (esportsTeam) => {
        const outputPath = esportsTeam.Division === "WorldCup"
          ? "UI/战队/守望先锋世界杯"
          : `UI/战队/守望先锋联赛/${esportsTeam.Division}`;
        if (esportsTeam.Logo) {
          const textureInfo = textureInfoById[getShortGuid(esportsTeam.Logo)];
          if (!textureInfo) return;
          textureInfo.outputs.push({
            outputPath,
            outputName: generateImageFileName(esportsTeam.FullName, getShortGuid(esportsTeam.Id, 2)),
          });
        }
        if (esportsTeam.LogoAlt && esportsTeam.LogoAlt !== esportsTeam.Logo) {
          const textureInfo = textureInfoById[getShortGuid(esportsTeam.LogoAlt)];
          if (!textureInfo) return;
          textureInfo.outputs.push({
            outputPath,
            outputName: generateImageFileName(esportsTeam.FullName, getShortGuid(esportsTeam.Id, 2), "alt"),
          });
        }
      },
    });
  }

  // MARK: output
  {
    spinnerProgress.start("输出图片", Object.values(textureInfoById).length);

    await Bun.file(path.join(OUTPUT_DIR, "texture-info.json"))
      .write(`${JSON.stringify(Object.values(textureInfoById).sort((a, b) => a.idN - b.idN), null, 2)}\n`);

    const analyzedOutputDir = path.join(process.env.MyDataDrive!, "Pictures/守望先锋");
    await emptyDir(analyzedOutputDir);
    const queue = new PQueue({ concurrency: 10 });
    const handleTexture = async (textureInfo: TextureInfo) => {
      const existingPath = path.join(OWLIB_UI_TEXTURE_DIR, `${textureInfo.id}.png`);
      if (textureInfo.outputs.length === 0) {
        textureInfo.outputs.push({
          outputPath: `未分类/${textureInfo.resolution}`,
          outputName: generateImageFileName(String(textureInfo.idN).padStart(6, "0"), textureInfo.id),
        });
      }
      if (textureInfo.outputs.length > 1 && textureInfo.outputs.some(t => !t.lowPriority)) {
        textureInfo.outputs = textureInfo.outputs.filter(t => !t.lowPriority);
      }
      const outputPaths = new Set<string>(textureInfo.outputs.map(t => path.join(t.outputPath, t.outputName)));
      for (const outputPath of outputPaths) {
        const fullPath = path.join(analyzedOutputDir, outputPath);
        await ensureDir(path.dirname(fullPath));
        if (await Bun.file(fullPath).exists()) {
          spinnerProgress.pause(() => {
            logger.error(`文件已存在: ${fullPath}`);
            console.error(textureInfo);
          });
          process.exit(1);
        }
        await link(existingPath, fullPath);
      }
    };

    for (const textureInfo of Object.values(textureInfoById)) {
      queue.add(async () => {
        try {
          await handleTexture(textureInfo);
        }
        catch (error) {
          spinnerProgress.pause(() => {
            logger.error("\n输出图片失败");
            console.error(error);
          });
        }
        finally {
          spinnerProgress.increment();
        }
      });
    }
    await queue.onIdle();
    spinnerProgress.succeed();
  }
}

function generateImageFileName(...parts: string[]) {
  return `${parts.join("_").replaceAll(/[\n\\/<>?*"]/g, "~")}.png`;
}

function getShortGuid(guid: string, length: number = 12) {
  return guid.substring(12 - length, 12);
}

function getNumberId(guid: string, length: number) {
  return String(Number.parseInt(guid.substring(0, 12), 16)).padStart(length, "0");
}
