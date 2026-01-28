# TabBar 图标调整指南

## 问题说明

如果TabBar图标显示变形、变虚，通常是因为：
1. 图标尺寸过大（超过推荐尺寸）
2. 图标内容没有居中，缺少留白
3. 图标被微信小程序自动缩放时拉伸变形

## 解决方案

### 推荐图标尺寸

**方案1（推荐）**：如果图标已经变形，建议使用更小尺寸
- **画布尺寸**：48px × 48px
- **图标内容**：36px × 36px（居中放置）
- **留白**：周围各留 6px 空白

**方案2**：如果54x54尺寸合适，但显示变形
- **画布尺寸**：54px × 54px
- **图标内容**：40px × 40px（居中放置，确保居中）
- **留白**：周围各留 7px 空白
- **重要**：图标内容不要填满整个画布，必须居中且有留白

### 图标制作步骤

1. **创建画布**
   - 新建 54px × 54px 的透明画布

2. **绘制图标**
   - 在画布中心绘制 40px × 40px 的图标内容
   - 确保图标在画布中居中

3. **导出图标**
   - 导出为 PNG 格式
   - 保持透明背景
   - 普通状态：颜色 `#6E6E70`（灰色）
   - 激活状态：颜色 `#C9A962`（金色）

### 如果已有图标需要调整

#### 方法1：使用设计工具调整

1. **Photoshop / Figma / Sketch**
   - 打开现有图标
   - 创建 54px × 54px 新画布
   - 将图标内容缩小到 40px × 40px
   - 居中放置
   - 导出为 PNG

2. **在线工具**
   - 使用 Canva、Photopea 等在线工具
   - 创建 54px × 54px 画布
   - 调整图标大小并居中

#### 方法2：使用命令行工具（ImageMagick）

```bash
# 调整图标尺寸并添加留白
convert input.png -resize 40x40 -background transparent -gravity center -extent 54x54 output.png
```

#### 方法3：使用 Python 脚本

```python
from PIL import Image

# 打开原图标
img = Image.open('input.png')

# 调整图标内容到40x40
img = img.resize((40, 40), Image.Resampling.LANCZOS)

# 创建54x54透明画布
canvas = Image.new('RGBA', (54, 54), (0, 0, 0, 0))

# 计算居中位置
x = (54 - 40) // 2
y = (54 - 40) // 2

# 将图标粘贴到画布中心
canvas.paste(img, (x, y), img if img.mode == 'RGBA' else None)

# 保存
canvas.save('output.png')
```

### 图标命名规范

确保图标文件命名正确：
- `tab-home.png` / `tab-home-active.png`
- `tab-market.png` / `tab-market-active.png`
- `tab-assets.png` / `tab-assets-active.png`
- `tab-profile.png` / `tab-profile-active.png`

### 验证图标

调整后，在微信开发者工具中：
1. 清除缓存
2. 重新编译
3. 检查TabBar图标是否清晰、不变形

## 常见问题

**Q: 为什么图标还是模糊？**
A: 确保使用 PNG 格式，不要使用 JPG。图标内容应该是矢量或高分辨率位图。

**Q: 图标显示太小怎么办？**
A: 可以适当增大图标内容到 44px × 44px，但不要超过 48px，保持留白。

**Q: 可以使用 SVG 吗？**
A: 微信小程序 TabBar 不支持 SVG，必须使用 PNG 格式。

## 参考尺寸

| 元素 | 尺寸 | 说明 |
|------|------|------|
| 画布 | 54px × 54px | TabBar图标画布 |
| 图标内容 | 40px × 40px | 实际图标大小 |
| 留白 | 7px | 四周留白 |
| 普通状态颜色 | #6E6E70 | 灰色 |
| 激活状态颜色 | #C9A962 | 金色 |
