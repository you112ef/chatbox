## 项目结构

-   `src` 应用源码
    -   `src/main`：主进程代码，Electron 客户端后端
    -   `src/renderer`：渲染层代码，Electron 客户端前端
-   `release`：打包结果

## 主要命令

### 安装依赖

```shell
npm install
```

### 启动开发环境

```shell
npm start
```

### 代码风格与测试

```shell
# 代码格式化
npm run prettier

# 代码风格检查：仅作参考，不用全部遵守
npm run lint

# 执行单元测试：
npm run test
```

### 本地打包

```shell
npm run package
```

根据当前系统平台进行打包。理论上不需要任何配置就能打包成功，打包结果在 `release/build` 目录下，打包后的应用程序可以正常安装使用，但是因为缺少证书无法作为正式版本直接发布。

### 打包与发布（正式版）

```shell
npm run release
```

这个命令用于正式版本的打包与发布，需要正确配置 `electron-builder.env` 才能正常工作。

这个命令会在本地打包所有系统平台版本，并进行签名、公证，然后发布到远程资源服务（Cloudflare R2、Github Release Draft）。打包结果在 `release/release` 目录下。

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

## 常用脚本

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

## 配置路径

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
