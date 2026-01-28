# 图标资源说明

本目录需要放置以下图标文件：

## TabBar 图标（需要两套：普通和激活状态）

**重要提示**：如果您的图标已经是54x54px但仍然变形，请检查以下几点：

1. **图标内容是否居中**：图标内容应该在画布中心，不要填满整个画布
2. **是否有足够留白**：图标内容应该是40x40px左右，周围留7px空白
3. **如果还是变形**：可以尝试更小的尺寸 **48x48px**（图标内容36x36px居中）

- `tab-home.png` / `tab-home-active.png` - 首页图标
  - 如果54x54变形：使用48x48px（图标内容36x36px居中）
  - 如果54x54正常：保持54x54px（图标内容40x40px居中）
- `tab-market.png` / `tab-market-active.png` - 行情图标（同上）
- `tab-assets.png` / `tab-assets-active.png` - 资产图标（同上）
- `tab-profile.png` / `tab-profile-active.png` - 我的图标（同上）

**图标制作建议**：
1. 画布尺寸：48x48px 或 54x54px
2. 图标内容：36x36px（48画布）或 40x40px（54画布），**必须居中**
3. 留白：周围各留6-7px空白
4. 格式：PNG，支持透明背景，分辨率足够高
5. **关键**：图标内容不要填满画布，必须居中且有留白

## 功能图标

- `icon-bell.png` - 通知图标（建议尺寸：40x40px）
- `icon-search.png` - 搜索图标（建议尺寸：36x36px）
- `icon-gold.png` - 黄金图标（建议尺寸：64x64px）
- `icon-silver.png` - 白银图标（建议尺寸：64x64px）
- `icon-user.png` - 用户图标（建议尺寸：80x80px）
- `icon-calculator.png` - 计算器图标（建议尺寸：48x48px）
- `icon-trend.png` - 趋势图标（建议尺寸：48x48px）
- `icon-arrow-left.png` - 左箭头/返回图标（建议尺寸：40x40px）
- `icon-arrow-right.png` - 右箭头（建议尺寸：40x40px）
- `icon-arrow-down.png` - 下箭头（建议尺寸：40x40px）
- `icon-calendar.png` - 日历图标（建议尺寸：40x40px）
- `icon-up.png` - 上涨图标（建议尺寸：24x24px）
- `icon-refresh.png` - 刷新图标（建议尺寸：28x28px）
- `icon-edit.png` - 编辑图标（建议尺寸：28x28px）

## 图标要求

1. **格式**: PNG（支持透明背景）
2. **颜色**: 
   - 普通状态：`#6E6E70`（灰色）
   - 激活状态：`#C9A962`（金色）
3. **风格**: 简洁、现代，符合深色主题

## 图标获取方式

1. 使用设计稿中的图标（从 Pencil 导出）
2. 使用图标库（如 IconFont、Lucide Icons）
3. 使用设计工具自行设计

## 临时方案

如果暂时没有图标，可以：
1. 使用文字代替图标
2. 使用简单的几何图形
3. 使用微信小程序内置图标

## 图标调整

如果TabBar图标显示变形、变虚，请参考 `TabBar图标调整指南.md` 文件，按照推荐尺寸（54x54px，内容40x40px居中）重新制作图标。
