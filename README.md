# WebFFX: Local-first Converter


基于 <a href="https://ffmpegwasm.netlify.app/">ffmpeg.wasm</a>、<a href="https://www.typescriptlang.org/" >Typescript</a>、<a href="https://nextjs.org/" >Next.js</a> 构建

        
## 项目架构

- **根目录**:
  - <i class="fas fa-file-code"></i> `.editorconfig`: 编辑器配置文件，确保不同开发者之间的代码风格一致。
  - <i class="fas fa-file-code"></i> `.eslintrc.json`: ESLint 配置文件，用于代码质量和风格检查。
  - <i class="fas fa-file-code"></i> `.gitignore`: Git 忽略文件配置。
  - <i class="fas fa-file-code"></i> `babel.config.js`: Babel 配置文件，用于 JavaScript 代码的编译。
  - <i class="fas fa-file-code"></i> `next-env.d.ts`: Next.js 的 TypeScript 环境配置文件。
  - <i class="fas fa-file-code"></i> `next.config.js`: Next.js 配置文件。
  - <i class="fas fa-file-code"></i> `package.json`: 项目依赖和脚本配置文件。
  - <i class="fas fa-file-code"></i> `tsconfig.json`: TypeScript 配置文件。
  - <i class="fas fa-file-code"></i> `typings.d.ts`: 全局类型定义文件。
  - <i class="fas fa-file-code"></i> `README.md`: 项目说明文件。

- **.next/**:
  - <i class="fas fa-file-code"></i> `build-manifest.json`: 构建清单文件。
  - <i class="fas fa-folder"></i> `cache/`: 缓存目录。
  - <i class="fas fa-folder"></i> `server/`: 服务器相关文件和配置。
    - <i class="fas fa-file-code"></i> `middleware-build-manifest.js`: 中间件构建清单。
    - <i class="fas fa-file-code"></i> `middleware-manifest.json`: 中间件清单文件。
    - <i class="fas fa-file-code"></i> `middleware-react-loadable-manifest.js`: 中间件 React 可加载清单。
    - <i class="fas fa-file-code"></i> `next-font-manifest.js`: 字体清单文件。
    - <i class="fas fa-file-code"></i> `next-font-manifest.json`: 字体清单文件。
    - <i class="fas fa-folder"></i> `pages/`: 页面目录。

- **pages/**:
  - <i class="fas fa-file-code"></i> `_app.tsx`: 自定义 App 组件。
  - <i class="fas fa-folder"></i> `api/`: API 路由目录。
  - <i class="fas fa-folder"></i> `app/`: 应用程序目录。
  - <i class="fas fa-file-code"></i> `index.tsx`: 首页组件。

- **public/**:
  - <i class="fas fa-folder"></i> `static/`: 静态资源目录。

## 主要依赖包

在 `package.json` 文件中定义了项目的主要依赖包。以下是一些关键的依赖包：

- <i class="fas fa-box"></i> `next`: Next.js 框架，用于服务端渲染和静态网站生成。
- <i class="fas fa-box"></i> `react`: React 库，用于构建用户界面。
- <i class="fas fa-box"></i> `react-dom`: React DOM 库，用于在浏览器中渲染 React 组件。
- <i class="fas fa-box"></i> `typescript`: TypeScript 语言，用于静态类型检查。

你可以在 `package.json` 文件中查看所有的依赖包和版本信息。
