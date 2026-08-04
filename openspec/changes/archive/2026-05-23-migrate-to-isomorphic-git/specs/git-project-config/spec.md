## MODIFIED Requirements

### Requirement: Project config data model
系统 SHALL 为每个Git项目源维护以下配置字段：唯一标识（自动生成）、项目名称（必填，纯英文/数字/连字符/下划线，最多100字符）、Git仓库地址（https://、ssh:// 或 git@ 格式）、项目描述（可选，最多100字符）、鉴权方式（枚举：password / sshkey）、凭证数据（账号密码JSON 或 SSH Key文本）、最后同步 commit hash（`lastCommitHash`，可选，用于增量同步判断）。IndexedDB 中 MUST 以项目名称（`projectName`）作为数据隔离 key，替代自动生成的 projectId。

#### Scenario: Create project config with username/password auth
- **WHEN** 用户添加项目并选择"密码/Token"鉴权方式
- **THEN** 系统存储包含 `username` 和 `password` 字段的凭证对象
- **AND** `authType` 存储为 `password`

#### Scenario: Create project config with SSH key auth
- **WHEN** 用户添加项目并选择"SSH Key"鉴权方式
- **THEN** 系统存储包含 `sshKey` 字段的凭证对象
- **AND** `authType` 存储为 `sshkey`

#### Scenario: Create project config with description
- **WHEN** 用户添加项目并填写了描述
- **THEN** 系统存储包含 `description` 字段的项目配置

#### Scenario: Update lastCommitHash after sync
- **WHEN** 项目同步完成
- **THEN** 系统更新项目配置中的 `lastCommitHash` 字段为当前 HEAD commit hash

## ADDED Requirements

### Requirement: Project name English-only validation
系统 SHALL 在保存项目配置前验证项目名称仅包含英文字母（a-z, A-Z）、数字（0-9）、连字符（-）、下划线（_）、点号（.）。MUST 拒绝包含中文、空格或其他非 ASCII 字符的名称，提示"项目名称仅支持英文、数字、连字符和下划线"。

#### Scenario: Valid English project name
- **WHEN** 用户输入项目名称 `my-frontend-app`
- **THEN** 系统通过验证，允许保存

#### Scenario: Invalid Chinese project name
- **WHEN** 用户输入项目名称 `我的前端项目`
- **THEN** 系统拒绝保存并提示"项目名称仅支持英文、数字、连字符和下划线"

#### Scenario: Invalid name with spaces
- **WHEN** 用户输入项目名称 `my project`
- **THEN** 系统拒绝保存并提示"项目名称仅支持英文、数字、连字符和下划线"

### Requirement: IndexedDB key by project name
系统 SHALL 使用项目名称（`projectName`）作为 IndexedDB 中 `files` 和 `trees` 对象存储的数据隔离 key，替代自动生成的 `projectId`。同一项目名称的多次同步 MUST 覆盖旧缓存数据。

#### Scenario: Store files by project name
- **WHEN** 项目名称为 `my-app` 的同步完成
- **THEN** 系统将文件写入 IndexedDB，`projectId` 字段值为 `my-app`
- **AND** `trees` 存储以 `my-app` 为 keyPath

#### Scenario: Re-sync overwrites old data
- **WHEN** 项目名称为 `my-app` 再次同步
- **THEN** 系统清除 `my-app` 的旧文件缓存，写入新数据

### Requirement: Multi-platform git URL support
系统 SHALL 支持解析多平台 git URL 格式（GitHub、GitLab、Bitbucket、Gitee 等），`parseGitUrl()` MUST 提取 git HTTP endpoint 用于 isomorphic-git 通信，不再仅解析 GitLab 项目路径。

#### Scenario: Parse GitHub URL
- **WHEN** Git 地址为 `https://github.com/user/repo.git`
- **THEN** `parseGitUrl()` 返回 `{ url: 'https://github.com/user/repo.git', platform: 'github' }`

#### Scenario: Parse GitLab URL
- **WHEN** Git 地址为 `https://gitlab.example.com/group/project.git`
- **THEN** `parseGitUrl()` 返回 `{ url: 'https://gitlab.example.com/group/project.git', platform: 'gitlab' }`

#### Scenario: Parse SSH-style URL
- **WHEN** Git 地址为 `git@github.com:user/repo.git`
- **THEN** `parseGitUrl()` 返回 `{ url: 'https://github.com/user/repo.git', platform: 'github' }`
