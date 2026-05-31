# AGENTS.md

## 交流规范

- 所有交流必须使用中文

## 项目结构

本扩展同时支持 Chrome（含 Edge、Opera 等 Chromium 内核浏览器）和 Firefox。

```
AIHelper/
├── shared/                    ← 公共业务逻辑（chat.js, config.js, knowledge.js 等）
├── skills/                    ← 技能定义（两边共享）
├── chrome-extension/          ← Chrome 扩展（可直接加载/打包）
│   ├── manifest.json
│   └── src/
│       ├── background.js
│       ├── headerManager.js   ← Chrome DNR 实现
│       ├── panel/             ← Chrome Side Panel 入口
│       ├── content/           ← 公共 content scripts
│       └── shared/            ← sync.sh 生成，勿直接编辑
├── firefox-extension/         ← Firefox 扩展（可直接加载/打包）
│   ├── manifest.json
│   └── src/
│       ├── background.js
│       ├── headerManager.js   ← Firefox webRequest 阻塞实现
│       ├── popup/             ← Firefox sidebar 入口
│       ├── content/           ← sync.sh 生成，勿直接编辑
│       └── shared/            ← sync.sh 生成，勿直接编辑
└── sync.sh                    ← 同步脚本
```

### 文件编辑规则

- **`shared/` 目录是公共代码的唯一真相源**。需要修改共享业务逻辑时，编辑 `shared/` 下的文件，而不是 `chrome-extension/src/shared/` 或 `firefox-extension/src/shared/`。
- **编辑 `shared/` 后必须运行 `bash sync.sh`**，将修改同步到两个扩展目录。否则扩展加载的是旧代码。
- **`skills/` 目录同理**，编辑后需运行 sync.sh。
- **`chrome-extension/src/content/` 是 content scripts 的唯一真相源**，编辑后需运行 sync.sh 同步到 Firefox。
- **平台专属文件直接编辑对应的扩展目录**，无需 sync：
  - `chrome-extension/src/background.js` / `headerManager.js` / `panel/` 
  - `firefox-extension/src/background.js` / `headerManager.js` / `popup/`
