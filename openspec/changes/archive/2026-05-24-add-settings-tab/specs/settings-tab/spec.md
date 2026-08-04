## ADDED Requirements

### Requirement: Settings Tab Navigation
系统 SHALL 在顶部 Tab 栏中增加「设置」Tab 按钮，点击后切换到设置页面，并激活该按钮的选中样式。

#### Scenario: User clicks Settings tab
- **WHEN** 用户点击「设置」Tab 按钮
- **THEN** 当前激活 Tab 切换为「设置」，其他 Tab 取消激活，设置页面内容区域显示

### Requirement: Settings Page Layout
设置页面 SHALL 采用左右分栏布局：左侧为设置导航菜单（固定宽度 140px），右侧为子页面内容区域（自适应剩余宽度）。

#### Scenario: Settings page renders with left-right layout
- **WHEN** 用户进入「设置」Tab
- **THEN** 页面显示左侧导航栏和右侧内容区域，导航栏默认选中第一项

### Requirement: Settings Sub-page Navigation
左侧导航栏 SHALL 包含「供应商」和「基础配置」两个菜单项。点击菜单项后，右侧内容区域切换为对应子页面内容。

#### Scenario: User clicks "供应商" nav item
- **WHEN** 用户在设置页面点击左侧「供应商」导航项
- **THEN** 右侧显示供应商配置内容，「供应商」导航项高亮

#### Scenario: User clicks "基础配置" nav item
- **WHEN** 用户在设置页面点击左侧「基础配置」导航项
- **THEN** 右侧显示基础配置内容，「基础配置」导航项高亮
