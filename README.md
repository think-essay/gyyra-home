# Gyyra Home Page

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.gyyra.cn&label=www.gyyra.cn)](https://www.gyyra.cn)
[![Deploy](https://github.com/think-essay/gyyra-home/actions/workflows/deploy-server.yml/badge.svg)](https://github.com/think-essay/gyyra-home/actions/workflows/deploy-server.yml)
[![Bing Wallpaper](https://github.com/think-essay/gyyra-home/actions/workflows/auto-bing.yml/badge.svg)](https://github.com/think-essay/gyyra-home/actions/workflows/auto-bing.yml)
[![WakaTime Theme](https://github.com/think-essay/gyyra-home/actions/workflows/daily-theme-update.yml/badge.svg)](https://github.com/think-essay/gyyra-home/actions/workflows/daily-theme-update.yml)

这是 [Gyyra](https://www.gyyra.cn) 的个人主页项目。页面保留了简洁的单页视觉风格，并加入 Bing 每日壁纸、Hitokoto 一言、WakaTime 编码统计、GitHub Models 周报和云服务器自动部署。

## 在线访问

- 主页：<https://www.gyyra.cn>
- GitHub：<https://github.com/think-essay>
- 项目仓库：<https://github.com/think-essay/gyyra-home>

## 主要功能

- 响应式单页个人主页
- 自动轮换 Bing 每日壁纸
- 通过 Hitokoto API 加载一言
- 根据 WakaTime 编码时长自动切换页面主题
- 使用 GitHub Models 生成每周编码总结
- GitHub Actions 定时更新数据并提交生成文件
- 推送到 `main` 分支后自动部署到云服务器
- 部署完成后自动校验并重载 Nginx

## 技术组成

- HTML5、CSS3、原生 JavaScript
- dmego-home-page 的基础样式与图标资源
- WakaTime API
- GitHub Models API
- Bing Homepage Image API
- Hitokoto API
- GitHub Actions
- rsync、SSH 与 Nginx

## 自动化工作流

| 工作流 | 用途 | 触发方式 |
| --- | --- | --- |
| `deploy-server.yml` | 同步静态文件到云服务器并重载 Nginx | 推送到 `main` 或手动运行 |
| `auto-bing.yml` | 获取最新 Bing 壁纸并生成图片列表 | 每日定时或手动运行 |
| `daily-theme-update.yml` | 获取 WakaTime 数据、生成主题与 AI 周报 | 每日定时或手动运行 |

WakaTime 和 Bing 工作流在生成新数据后会自动触发服务器部署，因此不需要手工上传生成文件。

## 本地修改与发布

1. 使用 VS Code 打开项目目录。
2. 修改文件并保存。
3. 在“源代码管理”中填写提交说明并提交。
4. 点击“同步更改”或“推送”。
5. 等待 GitHub Actions 完成，网站会自动更新。

请不要手工维护以下生成文件，它们会被自动化工作流覆盖：

- `assets/json/config.js`
- `assets/json/weekly.js`
- `assets/json/images.js`

## GitHub Secrets

自动化需要在仓库中配置以下 Secrets。这里只列出名称，任何密钥或服务器信息都不应提交到仓库：

- `GH_TOKEN`
- `WAKATIME_TOKEN`
- `SERVER_HOST`
- `SERVER_PORT`
- `SERVER_USER`
- `SERVER_DEPLOY_PATH`
- `SERVER_SSH_KEY`
- `SERVER_KNOWN_HOSTS`

## 上游项目与致谢

本项目基于 [dmego/home.github.io](https://github.com/dmego/home.github.io) 进行 fork 与二次开发。主页的核心布局、基础视觉样式、图标体系和部分交互思路来自该项目；当前仓库增加了 Gyyra 的个人内容、视觉配置、WakaTime 主题、GitHub Models 周报以及面向云服务器的自动部署能力。

上游项目还注明了以下设计来源，本项目在此保留相同的致谢与引用说明：

- [Vno](https://github.com/onevcat/vno-jekyll)：Jekyll 主题与整体设计来源之一
- [Mno](https://github.com/mcc108/mno)：部分页面加载效果的参考来源
- [北岛向南的小岛](https://javef.github.io/)：头像样式的参考来源

本项目同时使用或调用了以下服务：

- [dmego-home-page](https://www.npmjs.com/package/dmego-home-page)：通过 UNPKG 加载基础样式、字体和图标资源
- [Hitokoto](https://hitokoto.cn/)：一言内容服务
- [Bing](https://www.bing.com/)：每日壁纸来源
- [WakaTime](https://wakatime.com/)：编码活动统计
- [GitHub Models](https://github.com/marketplace/models)：每周编码总结生成

感谢以上项目作者和服务提供方。本仓库不声称拥有上游模板、第三方图标、字体或外部服务内容的原创权利。

## 许可证

上游项目采用 MIT License，本项目继续保留仓库中的 [LICENSE](./LICENSE) 文件。使用、修改或分发时，请同时遵守上游项目及各第三方资源的许可与使用条款。
