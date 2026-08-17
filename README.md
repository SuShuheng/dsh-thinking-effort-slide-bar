# DSH Effort Switcher

将 DSH Web 聊天输入区原有的模型/推理强度选择入口替换为推理强度滑动条。滑块会调用 DSH 的 `modelDirectories` 服务提交当前模型的 `reasoningEffort`，因此设置会作用于后续请求。

## 要求

- DSH `0.1.0-rc.6` 或兼容的 Web profile。
- 当前模型必须暴露至少一个 reasoning effort 级别。普通非推理模型不会显示滑块。

## 安装

DSH 不会扫描 `~/.dsh/plugins` 目录。插件必须作为当前 profile 的本地依赖，并通过 profile 的 Cordis patch 注册。

以下命令适用于 Windows PowerShell 和当前 Web profile。

1. 在 profile 中链接本地项目：

```powershell
cd C:\Users\June\.dsh\profiles\web
pnpm add --save-dev "github:lemonorangeapple/dsh-effort-switcher"
```

2. 编辑 `C:\Users\June\.dsh\profiles\web\cordis.patch.yml`，将内容设为：

```yaml
- insert:
    - id: effort-switcher
      name: dsh-effort-switcher
```

如果该文件已经有其他 patch 项，将上面的 `insert` 项追加到顶层 YAML 数组，不要覆盖现有项。

3. 完全停止并重新启动 `dsh web`，然后刷新 `http://127.0.0.1:3080`。

DSH 仅在 Web 进程启动时扫描 `dsh.client` 元数据；仅刷新旧页面或运行独立开发服务器不会加载本插件。

## 验证安装

在 profile 目录中运行：

```powershell
node --input-type=module -e "const plugin=await import('dsh-effort-switcher'); console.log(plugin.name)"
```

预期输出：

```text
effort-switcher
```

启动 DSH Web 后，选择一个支持 reasoning effort 的模型。聊天输入区模型控件的位置应显示“推理强度”滑块；拖动滑块后，DSH 会重新提交当前模型及新的 `reasoningEffort`。

## 项目结构

```text
index.js       Browser client module and slider UI.
host.js        Minimal Cordis host entry used by DSH loader discovery.
package.json   Package exports and dsh.client manifest.
README.md      Installation and operating instructions.
.gitignore     Local development exclusions.
```

## 开发

修改 `index.js` 后，必须重启 `dsh web` 并刷新现有 Web GUI，除非当前 DSH checkout 已运行针对该客户端包的 HMR 构建监视器。

可运行基础语法检查：

```powershell
npm run check
```

## 排障

- **滑块没有显示**：确认 `cordis.patch.yml` 中存在 loader 条目，完全重启 `dsh web`，并在模型选择器中选用支持 reasoning effort 的模型。
- **安装后页面未更新**：Web 启动图已经生成；停止旧 `dsh web` 进程后重新启动。
- **拖动后未生效**：检查模型是否支持多个 reasoning effort 级别。对于仅有默认强度或不支持 reasoning 的模型，插件会隐藏控件。
