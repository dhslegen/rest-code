# 专注模式功能说明

## 功能概述

专注模式是一个现代化的界面交互功能，旨在解决当所有卡片展开时窗口出现滚轮冲突的问题。该功能通过一个优雅的悬浮按钮实现，让用户能够专心编辑脚本而不被界面滚动干扰。

## 功能特性

### 🎯 专注模式（Focus Mode）
- **智能激活**：点击右侧垂直居中的专注模式悬浮按钮
- **动态滚动**：智能检测滚动空间，仅在需要时滚动到编辑器区域
- **禁用滚轮**：防止意外滚动导致的界面不稳定
- **视觉反馈**：按钮状态变化，呼吸动画效果
- **快捷键支持**：`Cmd/Ctrl + F` 快速切换，提示消息中显示快捷键说明

### 🎨 现代化设计
- **悬浮按钮**：右侧垂直居中位置，支持拖拽自由定位
- **渐变背景**：蓝紫色渐变（正常）→ 红色渐变（激活）
- **流畅动画**：悬停、点击、拖拽状态的平滑过渡
- **光效细节**：按钮边框高光、扫光效果
- **呼吸动画**：激活状态下的脉冲动效

### ⚡ 交互体验
- **拖拽定位**：支持鼠标拖拽按钮到任意位置，位置记忆
- **精准交互**：拖拽操作不会触发专注模式切换，避免误操作
- **智能提示**：悬停显示操作说明和快捷键
- **明显反馈**：操作时的系统消息提示，包含快捷键说明
- **自动置底**：专注模式下内容变化时自动保持滚动到底部
- **响应式设计**：在不同屏幕尺寸下自适应

## 使用方法

### 激活专注模式
1. **点击按钮**：点击右侧的 "专注模式" 悬浮按钮
2. **使用快捷键**：按下 `Cmd+F`（Mac）或 `Ctrl+F`（Windows/Linux）
3. **智能效果**：
   - 动态检测是否需要滚动
   - 仅在有向下滚动空间时才滚动到编辑器区域
   - 禁用页面滚轮
   - 开始监听内容变化，自动保持置底效果
   - 按钮变为红色并显示 "退出专注"
   - 显示包含快捷键的成功提示消息

### 退出专注模式
1. **再次点击按钮**：点击红色的 "退出专注" 按钮
2. **使用快捷键**：再次按下 `Cmd+F`（Mac）或 `Ctrl+F`（Windows/Linux）
3. **恢复效果**：
   - 恢复页面滚轮功能
   - 停止内容变化监听
   - 按钮恢复蓝色并显示 "专注模式"
   - 显示包含快捷键的退出提示消息

### 自定义按钮位置
1. **拖拽移动**：鼠标悬停在按钮上，光标变为 "grab"
2. **按住拖拽**：按住鼠标左键并拖动到理想位置
3. **精准操作**：拖拽过程中不会意外触发专注模式切换
4. **自动限制**：按钮会自动限制在窗口可见范围内
5. **响应式调整**：窗口大小变化时，按钮位置会自动调整以保持可见

## 专注模式特性

### 🔄 自动保持置底
专注模式激活后，系统会智能监听以下变化并自动保持滚动到底部：

1. **内容变化监听**：
   - DOM结构变化（新增/删除脚本内容）
   - 样式属性变化（影响布局的CSS修改）
   - 类名变化（可能影响显示的class更新）

2. **窗口变化响应**：
   - 窗口大小调整时自动重新计算并保持置底
   - 延迟执行确保布局完成后再滚动

3. **智能检测**：
   - 仅在专注模式激活时进行监听
   - 避免不必要的性能消耗
   - 自动清理观察器防止内存泄漏

### 🎯 精准交互
- **拖拽阈值**：移动距离超过5像素才认定为拖拽操作
- **事件分离**：拖拽和点击事件完全分离，避免误触
- **状态管理**：准确追踪拖拽状态，确保交互准确性

## 按钮状态说明

### 正常状态
- **位置**：右侧垂直居中（可拖拽调整）
- **颜色**：蓝紫色渐变
- **图标**：聚焦圆圈 + 十字线
- **文字**：专注模式
- **提示**：进入专注模式 (Cmd/Ctrl+F) | 支持拖拽移动位置

### 激活状态
- **颜色**：红色渐变
- **图标**：展开箭头
- **文字**：退出专注
- **提示**：退出专注模式 (Cmd/Ctrl+F)
- **特效**：呼吸动画

### 拖拽状态
- **光标**：grabbing（抓取中）
- **缩放**：轻微放大效果
- **阴影**：增强的投影效果
- **动画**：禁用过渡动画以获得流畅拖拽体验

## 智能滚动逻辑

专注模式采用智能滚动检测，相比固定滚动到底部更加人性化：

1. **检测滚动空间**：判断页面是否存在向下滚动的空间
2. **当前位置评估**：检查是否已经在合适的位置查看编辑器
3. **智能滚动**：仅在需要时进行平滑滚动
4. **用户体验优化**：避免不必要的页面跳转

## 设计理念

这个功能的优化体现了以下设计理念：

1. **用户自主**：支持拖拽定位，让用户自定义按钮位置
2. **智能化**：动态检测滚动需求，避免不必要的页面跳转
3. **信息透明**：在提示消息中明确显示快捷键信息
4. **专业感**：精致的拖拽交互和视觉反馈

## 技术实现

- **Vue 3 Composition API**：响应式状态管理
- **拖拽交互**：原生DOM事件处理，支持边界限制
- **动态位置**：基于视窗坐标的绝对定位
- **智能检测**：滚动空间和位置的动态计算
- **事件管理**：完善的事件监听器生命周期管理
- **响应式设计**：窗口大小变化的自适应调整

## 浏览器兼容性

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

---

通过这些优化，专注模式提供了更加智能、灵活和用户友好的脚本编辑体验。 