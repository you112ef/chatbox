import type { Message } from 'src/shared/types'

function isMessageEmpty(m: Message): boolean {
  return m.content === '' && (m.pictures || []).length === 0
}

function mergeMessages(a: Message, b: Message): Message {
  const ret = { ...a }
  if (ret.content != '') {
    ret.content += '\n\n'
  }
  ret.content += b.content
  if (a.pictures || b.pictures) {
    ret.pictures = a.pictures ? a.pictures.concat(b.pictures || []) : b.pictures
  }
  return ret
}

/**
 * SequenceMessages organizes and orders messages to follow the sequence: system -> user -> assistant -> user -> etc.
 * 这个方法只能用于 llm 接口请求前的参数构造，因为会过滤掉消息中的无关字段，所以不适用于其他消息存储的场景
 * 这个方法本质上是 golang API 服务中方法的 TypeScript 实现
 * @param msgs
 * @returns
 */
export function sequenceMessages(msgs: Message[]): Message[] {
  // Merge all system messages first
  let system: Message = {
    id: '',
    role: 'system',
    content: '',
  }
  for (let msg of msgs) {
    if (msg.role === 'system') {
      system = mergeMessages(system, msg)
    }
  }
  // Initialize the result array with the non-empty system message, if present
  let ret: Message[] = isMessageEmpty(system) ? [] : [system]
  let next: Message = {
    id: '',
    role: 'user',
    content: '',
  }
  let isFirstUserMsg = true // Special handling for the first user message
  for (let msg of msgs) {
    // Skip the already processed system messages or empty messages
    if (msg.role === 'system' || isMessageEmpty(msg)) {
      continue
    }
    // Merge consecutive messages from the same role
    if (msg.role === next.role) {
      next = mergeMessages(next, msg)
      continue
    }
    // Merge all assistant messages as a quote block if constructing the first user message
    if (isMessageEmpty(next) && isFirstUserMsg && msg.role === 'assistant') {
      let quote =
        msg.content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n') + '\n'
      msg.content = quote
      next = mergeMessages(next, msg)
      continue
    }
    // If not the first user message, add the current message to the result and start a new one
    if (!isMessageEmpty(next)) {
      ret.push(next)
      isFirstUserMsg = false
    }
    next = msg
  }
  // Add the last message if it's not empty
  if (!isMessageEmpty(next)) {
    ret.push(next)
  }
  // If there's only one system message, convert it to a user message
  if (ret.length === 1 && ret[0].role === 'system') {
    ret[0].role = 'user'
  }
  return ret
}
