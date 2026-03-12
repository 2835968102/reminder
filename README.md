# Reminder 定时提醒软件

一个简单易用的Windows桌面定时提醒软件，基于Electron + React + Vite开发。

## 功能特性

- ✨ 简单直观的界面，容易使用
- ⏰ 支持设置任意时间的定时提醒
- 🔔 系统通知提醒，不会错过任何重要事项
- 📋 提醒列表管理，支持启用/禁用、删除操作
- 🌙 最小化到系统托盘，后台运行不占用空间
- 💾 数据本地存储，重启不丢失提醒

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React 18**: UI开发框架
- **Vite**: 快速构建工具
- **node-schedule**: 定时任务调度
- **electron-store**: 本地数据存储

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

## 生产构建

```bash
npm run build
```

构建完成后，安装包会生成在 `release` 目录下。

## 使用说明

1. 点击"添加提醒"按钮，填写提醒标题、内容和时间
2. 提醒会在设置的时间通过系统通知提醒你
3. 可以在提醒列表中管理所有提醒，支持启用/禁用和删除
4. 关闭主窗口后，应用会最小化到系统托盘，继续后台运行
5. 右键点击系统托盘图标可以显示主界面或退出应用

## 项目结构

```
.
├── src/
│   ├── main/           # 主进程代码
│   │   ├── index.js    # 主进程入口
│   │   └── preload.js  # 预加载脚本
│   └── renderer/       # 渲染进程代码
│       ├── components/ # React组件
│       ├── App.jsx     # 主应用组件
│       ├── main.jsx    # 渲染进程入口
│       └── index.css   # 全局样式
├── public/             # 静态资源
├── index.html          # HTML模板
├── vite.config.js      # Vite配置
├── electron-builder.config.js # 构建配置
└── package.json        # 项目配置
```
