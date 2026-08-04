## Why

当前资源管理模块通过 GitLab REST API 模拟 git 拉取操作，存在平台绑定（仅支持 GitLab）、速率限制敏感、不支持真实 git 协议等不稳定因素。isomorphic-git 是成熟的纯 JavaScript git 实现，已在项目中安装但未使用，可替代现有 API 方案，实现标准 git clone/fetch 操作，同时扩展对 GitHub、Bitbucket 等平台的支持。

## What Changes

- **BREAKING**: 将 `git-sync` 规范的同步机制从 GitLab REST API 替换为 isomorphic-git 的 `clone`/`fetch`/`log` 操作
- 新增基于 isomorphic-git 的 git 操作层，封装 clone、pull、log、listFiles 等核心功能
- 保留 IndexedDB 缓存层，将 git objects 映射到现有 `files`/`trees` 存储结构
- 扩展认证支持：HTTP Basic Auth + Token + SSH Key（通过 isomorphic-git 的 `onAuth` 回调）
- 删除 GitLab API 特定代码（`GitLabAPI` 对象、`findProjectId`、`fetchTree`/`fetchFileContent` 等），统一由 isomorphic-git 处理
- 保留 `parseGitUrl` 并增强为通用 git URL 解析（支持 GitHub、Bitbucket 等平台）
- 同步进度上报机制调整为基于 isomorphic-git 的 `onProgress` 事件

## Capabilities

### New Capabilities
- `git-operations`: 基于 isomorphic-git 的通用 git 操作封装层，提供 clone、pull、log、listFiles 等功能，支持多种 git 托管平台和多认证方式

### Modified Capabilities
- `git-sync`: 同步机制从 GitLab REST API 替换为 isomorphic-git（clone + fetch），文件树和内容获取方式变更，增量同步改为基于 git commit hash 对比
- `git-project-config`: 项目配置中鉴权方式扩展为支持多平台认证（HTTP Basic / Token / SSH Key），移除 GitLab 特定假设

## Impact

- **代码**: `chrome-extension/src/panel/resource.js` 中约 200 行 GitLab API 代码需替换，新增 `git-ops.js` 模块封装 isomorphic-git 操作
- **依赖**: isomorphic-git@1.38.1（已安装，无需新增依赖）
- **API**: 不再依赖 GitLab API 端点，改为标准 git 智能 HTTP 协议（`/info/refs?service=git-upload-pack`）
- **认证**: 支持多平台（GitHub/GitLab/Bitbucket），支持 HTTP Basic Auth、Personal Access Token、SSH Key
- **存储**: IndexedDB 结构不变，git objects 映射保持不变
