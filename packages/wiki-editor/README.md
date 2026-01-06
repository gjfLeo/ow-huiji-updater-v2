# wiki-editor

需要配置环境变量，可在项目根目录创建 `.env.local` 文件，需要的环境变量见 `env.d.ts`。

在项目根目录运行 `bun run packages/wiki-editor/src/index.ts` 启动。

各模块功能：

- `editPage`：下载Wiki页面至本地编辑，实时保存至Wiki。
- `copyFandomImage`：从英文Wiki（Fandom）下载图片，上传至Wiki。
