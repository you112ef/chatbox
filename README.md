- [项目结构](#项目结构)
- [安装依赖](#安装依赖)
      - [@capacitor/assets 与 M1/M2 的兼容问题](#capacitorassets-与-m1m2-的兼容问题)
- [开发常用命令](#开发常用命令)
    - [启动开发环境（Electron/Web）](#启动开发环境electronweb)
      - [性能瓶颈排查](#性能瓶颈排查)
    - [启动开发环境（iOS/Android）](#启动开发环境iosandroid)
    - [本地打包](#本地打包)
    - [语法检查](#语法检查)
    - [代码格式化](#代码格式化)
    - [代码风格检查：仅作参考，不用全部遵守](#代码风格检查仅作参考不用全部遵守)
    - [执行单元测试](#执行单元测试)
    - [（已弃用）打包与发布（正式版）](#已弃用打包与发布正式版)
    - [网页版部署](#网页版部署)
    - [提取软件包源码](#提取软件包源码)
    - [查看软件包证书和公证](#查看软件包证书和公证)
- [配置与日志路径](#配置与日志路径)
    - [配置文件](#配置文件)
    - [主进程的日志文件](#主进程的日志文件)


# 项目结构

-   `src` 应用源码
    -   `src/main`：主进程代码，Electron 客户端后端
    -   `src/renderer`：渲染层代码，Electron 客户端前端
-   `release`：打包结果

# 安装依赖

```shell
npm install
```

#### @capacitor/assets 与 M1/M2 的兼容问题

如果使用 @capacitor/assets 遇到了 sharp 与 M1/M2 的兼容问题：

```
Error: 
Something went wrong installing the "sharp" module
```

可以尝试卸载 vips，然后重新安装 @capacitor/assets

```shell
brew uninstall --force vips
```

[参考](https://github.com/ionic-team/capacitor-assets/issues/535)


# 开发常用命令

### 启动开发环境（Electron/Web）

```shell
npm run dev
```

自动启动 Electorn 应用，也可以访问 `http://localhost:1212` 打开网页版。

查看依赖库导致的 JS 文件大小占比，运行：

```shell
ANALYZE=true npm run dev
```

#### 性能瓶颈排查

因为各种原因，Electron 很难直接运行 react-developer-tools 这个浏览器插件，因此需要在浏览器中排查性能问题。

[react-developer-tools 插件安装](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi/related)

`npm start ` 后访问 `http://localhost:1212` 进入网页开发模式，`F12` 可查看到 React 开发工具。

### 启动开发环境（iOS/Android）

同步 Web 数据到移动端工程（主要是 `release/app/dist/renderer`）
```shell
npm run mobile:sync
```

同步数据并启动 IDE
```shell
npm run mobile:ios
npm run mobile:android
```

更新图片资源
```shell
npm run mobile:assets
```

移动端的测试、打包、上架等操作，都在对应的 IDE 中操作的。

### 本地打包

```shell
npm run package
```

根据当前系统平台进行打包。理论上不需要任何配置就能打包成功，打包结果在 `release/build` 目录下，打包后的应用程序可以正常安装使用，但是因为缺少证书无法作为正式版本直接发布。

有时候 MacOS 打包可能会报错 `hdiutil exited with code ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`，这和 MacOS 系统 Ventura 版本有关，也非常容易解决：进入设置，安全与隐私，完全磁盘访问权限，添加终端应用即可；进入设置，安全与隐私，应用管理，勾选终端。参考：https://github.com/electron-userland/electron-builder/issues/5431

### 语法检查
```shell
npm run check
```

### 代码格式化
```shell
npm run prettier
```

### 代码风格检查：仅作参考，不用全部遵守

```shell
npm run lint
```

### 执行单元测试

```shell
npm run test
```


### （已弃用）打包与发布（正式版）

现在改用 Github Action 来自动打包和发布了。本地开发后，只需要 git tag vX.X.X 并推送到远程仓库，Github Action 就会自动打包并发布。

原因是本地打包常常会遇到一些无法理解的环境问题，比如某些未知的环境变化，即使没有修改打包配置，也可能出现后续版本打包失败的情况。我后来改用了原来那台 Macbook Pro 进行打包，按道理环境应该没有变化、打包配置也没有改变，但依然无法正常打包。

以下是原来的文档。

---

```shell
npm run release
```

这个命令用于正式版本的打包与发布，需要正确配置 `electron-builder.env` 才能正常工作。

这个命令会根据当前 commit 的 tag 作为版本号（`v0.0.2`），然后在本地打包所有系统平台版本，并进行签名、公证，然后发布到远程资源服务（Cloudflare R2、Github Release Draft）。打包结果在 `release/release` 目录下。

命令执行完成后，应该检查打印日志中文件上传是否正常、 `[Notarize]` 相关是否正常。

所有文件上次正常后，会在用户测后续启动中触发自动更新功能。

### 网页版部署

编译前端代码

```shell
npm run build:renderer
```

启动 Web 服务

```shell
npm run serve:web
```

### 提取软件包源码

从编译打包后的应用包中提取源码

```shell
npx asar extract release/build/mac/Chatbox.app/Contents/Resources/app.asar ./tmp/asar
```

### 查看软件包证书和公证

查看证书

```shell
codesign -dv --verbose=4 ./release/build/mac/Chatbox.app

# 对比
codesign -dv --verbose=4 /Applications/Safari.app
```

查看公证

```shell
spctl -a -vv --verbose=4 ./release/build/mac/Chatbox.app

# 对比
spctl -a -vv --verbose=4 /Applications/Safari.app
```

# 配置与日志路径

### 配置文件

MacOS:

```shell
/Users/benn/Library/Application Support/xyz.chatboxapp.app

cd /Users/benn/Library/Application\ Support/xyz.chatboxapp.app
```

Windows:

```shell
%APPDATA%/xyz.chatboxapp.app
```

### 主进程的日志文件

MacOS

```shell
~/Library/Logs/xyz.chatboxapp.app/main.log

tail -n 100 ~/Library/Logs/xyz.chatboxapp.app/main.log
```

Windows

```
%USERPROFILE%\AppData\Roaming\{app name}\logs\main.log
```

