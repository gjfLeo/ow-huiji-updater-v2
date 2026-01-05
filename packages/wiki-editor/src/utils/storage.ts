import path from "node:path";
import destr from "destr";
import fse from "fs-extra";

interface WikiEditorStorage {
  dataToolPath: string;
  gamePath: string;

  lastOperation?: string;
  lastEditPageTitle?: string;
}

const STORAGE_PATH = path.join(__dirname, "../../output/wiki-editor-storage.json");

const defaultStorage: WikiEditorStorage = {
  dataToolPath: "C:/Programs/OWLib/DataTool.exe",
  gamePath: "C:/Programs/Overwatch",
};

let storageCache: WikiEditorStorage | null = null;

async function readStorage() {
  if (!storageCache) {
    if (await fse.exists(STORAGE_PATH)) {
      storageCache = Object.assign(
        {},
        defaultStorage,
        destr<WikiEditorStorage>(await fse.readFile(STORAGE_PATH, "utf8")),
      );
    }
    else {
      storageCache = { ...defaultStorage };
    }
  }
  return storageCache;
}

export async function getStorage<K extends keyof WikiEditorStorage>(key: K) {
  const storage = await readStorage();
  return storage[key];
}

export async function setStorage<K extends keyof WikiEditorStorage>(key: K, value: WikiEditorStorage[K]) {
  const storage = await readStorage();
  storage[key] = value;
  await fse.ensureFile(STORAGE_PATH);
  await fse.writeFile(STORAGE_PATH, JSON.stringify(storage, null, 2));
}

// function readStorageSync() {
//   if (!storageCache) {
//     if (fse.existsSync(STORAGE_PATH)) {
//       storageCache = Object.assign(
//         {},
//         defaultStorage,
//         destr<ToolStorage>(fse.readFileSync(STORAGE_PATH, "utf8")),
//       );
//     }
//     else {
//       storageCache = { ...defaultStorage };
//     }
//   }
//   return storageCache;
// }

// export function getStorageSync<K extends keyof ToolStorage>(key: K) {
//   const storage = readStorageSync();
//   return storage[key];
// }

// export function setStorageSync<K extends keyof ToolStorage>(key: K, value: ToolStorage[K]) {
//   const storage = readStorageSync();
//   storage[key] = value;
//   fse.writeFileSync(STORAGE_PATH, JSON.stringify(storage, null, 2));
// }
