- [项目结构](#项目结构)
- [安装依赖](#安装依赖)
      - [@capacitor/assets 与 M1/M2 的兼容问题](#capacitorassets-与-m1m2-的兼容问题)
- [桌面版/网页版开发](#桌面版网页版开发)
  - [开发环境](#开发环境)
    - [启动开发环境（Electron/Web）](#启动开发环境electronweb)
    - [查看依赖大小](#查看依赖大小)
    - [性能瓶颈排查](#性能瓶颈排查)
    - [代码检查/格式化](#代码检查格式化)
    - [本地打包](#本地打包)
      - ["hdiutil exited with code" 问题](#hdiutil-exited-with-code-问题)
    - [提取软件包源码](#提取软件包源码)
    - [查看软件包证书和公证](#查看软件包证书和公证)
  - [版本发布](#版本发布)
    - [发布动作](#发布动作)
    - [发布的常见问题](#发布的常见问题)
    - [（已弃用）本地打包与发布正式版](#已弃用本地打包与发布正式版)
    - [网页版部署](#网页版部署)
- [移动端开发（iOS/Android）](#移动端开发iosandroid)
  - [开发环境](#开发环境-1)
    - [同步代码到移动端工程](#同步代码到移动端工程)
    - [同步代码并启动 IDE](#同步代码并启动-ide)
    - [更新图片资源](#更新图片资源)
    - [Debug 和调试](#debug-和调试)
  - [生产部署](#生产部署)
- [配置与日志路径](#配置与日志路径)
    - [配置文件](#配置文件)
    - [主进程的日志文件](#主进程的日志文件)

# 项目结构

-   `src` 应用源码
    -   `src/main`：主进程代码：Electron 客户端后端
    -   `src/renderer`：渲染层代码：Electron 客户端前端、Web 版本
    -   `android`：Android 客户端的配置
    -   `ios`：iOS 客户端的配置
-   `release`：打包结果
    -   `release/app`：编译后的源码

# 安装依赖

```shell
npm install
```

移动端开发还需要安装 Android Studio 和 Xcode，具体参考 Capacitor 文档。

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

# 桌面版/网页版开发

## 开发环境

### 启动开发环境（Electron/Web）

```shell
npm run dev
```

默认情况下，会直接使用线上 API，如果需要使用本地 API，可以设置环境变量 `USE_LOCAL_API`：

```shell
USE_LOCAL_API=true npm run dev
```

自动启动 Electorn 应用，也可以访问 `http://localhost:1212` 打开网页版。

### 查看依赖大小

查看依赖库导致的 JS 文件大小占比，运行：

```shell
ANALYZE=true npm run dev
```

### 性能瓶颈排查

因为各种原因，Electron 很难直接运行 react-developer-tools 这个浏览器插件，因此需要在浏览器中排查性能问题。

[react-developer-tools 插件安装](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi/related)

`npm start ` 后访问 `http://localhost:1212` 进入网页开发模式，`F12` 可查看到 React 开发工具。

### 代码检查/格式化

1. 语法检查

```shell
npm run check
```

2. 代码格式化

```shell
npm run prettier
```

3. 代码风格检查：仅作参考，不用全部遵守

```shell
npm run lint
```

4. 执行单元测试

```shell
npm run test
```

### 本地打包

```shell
npm run package
```

根据当前系统平台进行打包。理论上不需要任何配置就能打包成功，打包结果在 `release/build` 目录下，打包后的应用程序可以正常安装使用，但是因为缺少证书无法作为正式版本直接发布。

#### "hdiutil exited with code" 问题

有时候 MacOS 打包可能会报错 `hdiutil exited with code ERR_ELECTRON_BUILDER_CANNOT_EXECUTE`，这和 MacOS 系统 Ventura 版本有关，也非常容易解决：进入设置、安全与隐私，完全磁盘访问权限、应用管理，添加终端、VS Code、ITerm2 即可。参考：https://github.com/electron-userland/electron-builder/issues/5431

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

## 版本发布

打包正式版本需要公证与签名，同时为了自动发布还需要一些资源配置（如 Cloudflare R2）。需要正确配置 `electron-builder.env` 才能正常工作。

### 发布动作

现在改用 Github Action 来自动打包和发布了。本地开发后，只需要 git tag vX.X.X 并推送到远程仓库，Github Action 就会自动打包并发布。

1. 修改 `app/package.json`，``app/package-lock.json` 中的版本号
2. 打标签 `git tag v0.0.1`
3. 推送标签 `git push --tags`

### 发布的常见问题

有时候 MacOS 发布会出现 notarize 失败的情况，可能是因为有新的开发者协议需要签署，登录开发者中心查看是否有新的协议需要签署。 https://developer.apple.com/account

### （已弃用）本地打包与发布正式版

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

1. 编译前端代码

```shell
npm run build:renderer
```

2. 启动 Web 服务

```shell
npm run serve:web
```

# 移动端开发（iOS/Android）

## 开发环境

主要开发工作一般在 Web 端进行，移动端只需要同步 Web 端的代码即可。

### 同步代码到移动端工程

主要进行生产环境编译，然后把 Web 代码（`release/app/dist/renderer`）同步到移动端工程中。

```shell
npm run mobile:sync
```

### 同步代码并启动 IDE

```shell
npm run mobile:ios
npm run mobile:android
```

### 更新图片资源

```shell
npm run mobile:assets
```

### Debug 和调试

#### Android 调试

chrome 访问 `chrome://inspect`，可以看到设备上运行的 App，可以进行调试

#### iOS 调试

在 Safari 设置中开启开发者模式，然后顶部菜单“开发”中选择模拟器，即可进行调试。

在 Xcode 或 Android Studio 中运行 App，然后 chrome 访问 `chrome://inspect`，可以看到设备上运行的 App，可以进行调试。

## 生产部署

移动端的测试、打包、上架等操作，都在对应的 IDE 中操作的。

打包上架的步骤：

1. 编译代码并同步到移动端工程
2. 修改版本号（版本号 v1.2.2 和 build number 整型递增数字）
   - Xcode 点击左侧栏的 “App” 顶部菜单，即可看到设置
   - Android Studio 顶部导航栏的 “File” -> “Project Structure” 即可看到设置
3. 构建正式签名版本
    - Xcode 点击顶部导航栏的 “Product” -> “Archive”
    - Android Studio 点击顶部导航栏的 “Build” -> “Generate Signed Bundle/APK”
4. iOS 可以在 Xcode 中直接上传，Android 需要在 Google Play Console 中手动上传
5. Android APK 打包后，命名成 chatbox.apk，然后复制到 Cloudflare R2 的 release 路径下，提供给用户下载

## 已知的坑

### Capacitor5 不支持 targetSdkVersion=34

如果改成 targetSdkVersion=34，那么在 Android 14 下应用启动会直接崩溃，报错信息与 Capacitor Share 插件有关。

这个问题可以 Android Studio 模拟器运行 Android 14 时直接复现。

最简单的修复方式是保持 targetSdkVersion=33，这样即使在 Android 14 下依然可以正常工作。

https://github.com/ionic-team/capacitor-plugins/issues/1823

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

#### 数据恢复的方法

在 MacOS 中，请打开终端应用，然后输入以下命令并按回车
```shell
cd 'Library/Application Support/xyz.chatboxapp.app' && ls
```

如果你看到了类似 `config-backup-2024-8-4.json` 这样的文件，那说明存在自动备份的数据文件（自动备份是为了预防类似的数据丢失问题发生）。

然后请执行以下命令（请替换备份文件名到你看到最新的备份文件名），这将会用备份数据覆盖当前数据。

```shell
cp config-backup-2024-8-4.json config.json
```

在 Windows 中，请打开文件管理器，在顶部的地址栏输入 `%APPDATA%/xyz.chatboxapp.app` 并回车。

如果你看到了类似 `config-backup-2024-8-4.json` 这样的文件，那说明存在自动备份的数据文件（自动备份是为了预防类似的数据丢失问题发生）。

请删除文件 `config.json` （当前生效的数据），然后复制最新的自动备份的数据文件，重命名为 `config.json`。

```
I apologize for the inconvenience you've experienced. This is not expected behavior, but rather a bug. I understand the importance of your conversations, and I'd like to offer some potential solutions to recover your data:

For macOS:
1. Open the Terminal application.
2. Enter the following command and press Enter:
   cd 'Library/Application Support/xyz.chatboxapp.app' && ls

If you see files like 'config-backup-2024-8-4.json', these are automatic backups created to prevent data loss in situations like this.

3. To restore from a backup, use the following command (replace the filename with the most recent backup you see):
   cp config-backup-2024-8-4.json config.json

For Windows:
1. Open File Explorer.
2. In the address bar at the top, enter '%APPDATA%/xyz.chatboxapp.app' and press Enter.
3. Look for files like 'config-backup-2024-8-4.json', these are automatic backups created to prevent data loss in situations like this.
4. Delete the current 'config.json' file.
5. Copy the most recent backup file and rename it to 'config.json'.

I hope this helps recover your data. To assist in resolving this bug and preventing future occurrences, could you please provide some additional details:

1. Did the data loss occur during an app upgrade?
2. Do you remember which version you upgraded from to the current version?
3. What is your operating system and its version?
4. What are your computer specifications (e.g., CPU, RAM)?

I have been tracking this bug for several months but have been unable to reproduce it locally (it has a very low incidence), which has hindered my ability to fix it. Your details will greatly help resolve this issue and prevent this problem from happening to other users in future releases. Thank you for being so patient.
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
