import type { CarCommand, CommandDomain } from '../../core/commandTypes'
import { useCarStore, type CarState } from '../../core/store'
import { allFeatures, getFeature } from '../../features/registry'
import type { AiSettings } from './aiSettings'

const TIMEOUT_MS = 8000

export interface LlmResult {
  commands: CarCommand[]
  reply?: string
  /** 被校验过滤掉的非法指令数量 */
  rejected: number
}

export class LlmError extends Error {}

function buildSystemPrompt(state: CarState) {
  const specs = allFeatures().map((f) => f.ai)
  return `你是车载语音助手，负责把用户的中文口语转成车控指令。
只输出一个 JSON 对象，格式为：{"commands": [指令...], "reply": "给用户的一句简短中文回复"}

可用指令：
${specs.map((s) => s.spec).join('\n\n')}

当前车辆状态：
${specs.map((s) => s.describeState(state)).join('\n')}

规则：
1. 用户的话可能包含识别错误的同音字，请按车控语境理解，例如「车床」应理解为「车窗」。
2. 可以理解间接表达，例如「有点闷」可以打开车窗透气，「要下雨了」可以关闭车窗。
3. 当前车型没有的车窗不要生成指令，在 reply 中说明。
4. 与车控无关的话，commands 返回空数组，reply 简短说明你能做什么。`
}

/** 兼容部分模型把 JSON 包在 \`\`\`json 代码块里的情况 */
function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const text = fenced ? fenced[1] : content
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new LlmError('模型没有返回 JSON')
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new LlmError('模型返回的 JSON 无法解析')
  }
}

function validateCommands(raw: unknown): { commands: CarCommand[]; rejected: number } {
  const list = Array.isArray(raw) ? raw : []
  const commands: CarCommand[] = []
  for (const item of list) {
    const domain = (item as { domain?: string } | null)?.domain as CommandDomain | undefined
    const cmd = domain ? getFeature(domain)?.ai.validate(item as Record<string, unknown>) : null
    if (cmd) commands.push(cmd)
  }
  return { commands, rejected: list.length - commands.length }
}

export async function parseByLlm(text: string, settings: Pick<AiSettings, 'baseUrl' | 'apiKey' | 'model'>): Promise<LlmResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(useCarStore.getState()) },
          { role: 'user', content: text },
        ],
      }),
    })
  } catch {
    if (controller.signal.aborted) throw new LlmError(`请求超时（${TIMEOUT_MS / 1000} 秒）`)
    throw new LlmError('网络请求失败，可能是网络问题，或该服务不允许浏览器跨域（CORS）调用')
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    const hint = response.status === 401 ? '，请检查 API Key' : ''
    throw new LlmError(`接口返回 ${response.status}${hint}${detail ? `：${detail.slice(0, 120)}` : ''}`)
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new LlmError('模型返回内容为空')

  const parsed = extractJson(content) as { commands?: unknown; reply?: unknown }
  const { commands, rejected } = validateCommands(parsed.commands)
  return { commands, rejected, reply: typeof parsed.reply === 'string' ? parsed.reply : undefined }
}
