# 3D 车模车控 Demo

基于 Vite + React + TypeScript + react-three-fiber 的纯前端 3D 车模车控 Demo：

- 3D 车模渲染：拖拽旋转、滚轮缩放、右键平移，白天 / 夜间场景切换
- 车控能力：车窗升降（支持开度）、蝴蝶门、门锁（锁车后不能开门，锁车 / 解锁双闪提示）、大灯、尾灯、左右转向灯、双闪、雨刷（低速 / 高速 / 刮一次）
- 点击车模上的车窗、车门、车灯、雨刷即可控制，悬停时显示部件名称和点击效果；侧边面板同步显示状态
- 浏览器 Web Speech API 语音控制（「打开车门」「把主驾车窗开一半」「打开大灯，然后雨刷快一点」「锁车」）
- 可选接入 OpenAI 兼容大模型理解间接表达（「有点闷」「要下雨了」「天黑了」），失败时自动回退到本地规则

## 运行

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # 规则解析与指令校验的单元测试
pnpm build
```

语音识别需要 Chrome 或 Edge，并且必须在 `localhost` 或 HTTPS 下访问；Chrome 的识别服务需要联网。不支持语音的浏览器可以使用面板里的文字输入。

调试参数：

- `?debug`：在控制台打印车模所有 mesh 名称，用于填写车型配置；同时在 `window` 上挂出 `__carRoot`、`__carStore`、`__carRigs` 便于调试
- `?car=<id>`：切换 `src/car/carProfiles.ts` 中的车型
- `?cam=x,y,z`：指定初始相机位置

## 架构

所有输入（点击、面板按钮、语音、文字）都转换成统一的 `CarCommand`，经指令总线执行：

```
点击部件 / 面板按钮 ─────────────────────┐
语音 / 文字 → 意图解析（规则 或 AI）──────┴→ CarCommand → 功能模块 execute → zustand 状态 → 3D 绑定（rig）/ UI
```

每个车控能力是一个 `FeatureModule`（见 `core/feature.ts`），集中提供：指令执行、指令描述、动画推进、规则解析、给大模型的说明与校验、点击部件的提示和行为。指令总线、规则解析器、大模型解析器、点击处理都只读取 `features/registry.ts` 这一个注册表。

```
src/
  app/                 布局与全局样式
  scene/               Canvas、昼夜灯光、轨道控制器、模型加载错误边界
  car/
    carProfiles.ts     车型配置：模型地址、尺寸、朝向、署名，以及车窗 / 车门 / 车灯 / 雨刷的节点映射
    CarModel.tsx       加载 glb、归一化尺寸、创建各部件 3D 绑定、逐帧更新、点击与悬停提示
    partTag.ts         mesh → 车控部件的标记，CarRig 接口
    highlight.ts       悬停高亮（克隆部件材质）
    splitMesh.ts       把左右共用的 mesh（如后转向灯）拆成两半
  core/
    feature.ts         FeatureModule 接口
    commandTypes.ts    CarCommand 联合类型
    commands.ts        指令总线、点击部件、逐帧推进
    store.ts           组合各能力的 zustand slice
    animated.ts        0~1 动画值工具
    logSlice.ts        操作日志
  features/
    registry.ts        能力注册表（顺序即规则解析的尝试顺序）
    window/            车窗：玻璃下降 + 裁剪面 + 点击热区
    door/              车门（蝴蝶门 / 侧开门铰链）与门锁
    light/             大灯、尾灯、转向灯、双闪，夜间光束与辉光
    wiper/             雨刷摆动
    scene/             白天 / 夜间场景
  voice/
    useSpeechRecognition.ts   Web Speech API 封装
    handleUtterance.ts        解析 → 执行 → 写日志
    intent/                   规则解析、大模型解析、AI 设置
  ui/                  侧边面板各卡片
```

## 更换车模

1. 把 glb 放到 `public/models/`。
2. 用 `?debug` 打开页面，在控制台找到车窗玻璃、车门、车灯、雨刷的 mesh 或节点名。
3. 在 `src/car/carProfiles.ts` 中新增一个车型，填写 `url`、`length`、`rotationY`（使车头朝向 +Z、左侧朝向 +X）、`attribution`，以及 `windows`、`doors`（`butterfly` 或 `swing`）、`lights`、`wiper` 映射。
4. 用 `?car=<id>` 访问，确认后可以把它设为默认车型。

要求：每扇车窗玻璃、每扇车门是独立节点，车门节点原点大致在铰链处；雨刷节点原点为转轴。没有配置的部件会在面板中显示为「不支持」，对应的语音指令会提示当前车型没有该部件。

## 扩展新的车控能力（以空调为例）

1. **状态与类型**：新建 `features/ac/acSlice.ts`，定义 `AcCommand { domain: 'ac'; action: 'on' | 'off' | 'setTemp'; value?: number }` 和对应 slice（slice 文件不要引用 store，避免循环依赖）。在 `core/commandTypes.ts` 的 `CarCommand` 中加入 `AcCommand`，在 `core/store.ts` 中组合 slice。
2. **功能模块**：新建 `features/ac/index.ts`，实现 `FeatureModule<AcCommand>`：`execute`、`describe`、`rules.parse`（关键词如「空调」「温度」「冷」「热」）、`ai`（说明、状态描述、校验）；有可点击部件时再实现 `part`。
3. **注册**：在 `features/registry.ts` 中加入 `ac: acModule`。由于注册表的类型要求每个 domain 都有模块，漏注册会编译报错。
4. **3D 绑定（可选）**：新建 `acRig3d.ts` 返回 `CarRig`，在 `CarModel.tsx` 的 `buildCar` 中创建。
5. **UI**：新增状态卡片，放进 `ui/ControlPanel.tsx`。

语音规则、大模型提示词、校验、点击提示会自动包含新能力，不需要修改 `voice/` 下的代码。

## AI 意图理解

在面板「AI 意图理解」中开启，选择服务商（OpenAI / DeepSeek / 通义千问 / 自定义 OpenAI 兼容接口），填写 API Key 后可以点「测试连接」。

- 请求 `/chat/completions`，使用 `response_format: json_object`，并把当前车辆状态写进系统提示词
- 返回的每条指令都要经过能力自带的校验器，非法指令会被过滤并在日志中注明
- 超时（8 秒）、网络或跨域错误、接口报错时，自动回退到本地规则解析

API Key 保存在浏览器 localStorage 中，由浏览器直接请求服务商接口，只适合本地 Demo。正式产品应改为通过后端代理调用。

## 模型署名

默认车模 [Car Concept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept) 作者为 Eric Chadwick / Darmstadt Graphics Group，采用 CC-BY 4.0 授权。页面左下角显示署名；更换 CC-BY 车模时，请同步更新车型配置里的 `attribution`。
