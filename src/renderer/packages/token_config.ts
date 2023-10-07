import { ModelProvider, SessionSettings } from '../../shared/types'
import { modelConfigs } from '../config'
import * as defaults from '../stores/defaults'

/**
 * 根据模型提供方、模型版本的设置，重置模型的 maxTokens、maxContextTokens
 */
export function resetTokenConfig(settings: SessionSettings): SessionSettings {
    switch (settings.aiProvider) {
        case ModelProvider.OpenAI:
            const limits = getTokenLimits(settings)
            settings.openaiMaxTokens = limits.minTokenLimit // 默认最小值
            settings.openaiMaxContextTokens = limits.maxContextTokenLimit // 默认最大值
            if (settings.model.startsWith('gpt-4')) {
                settings.openaiMaxContextMessageCount = 6
            } else {
                settings.openaiMaxContextMessageCount = 999
            }
            break
        case ModelProvider.Azure:
            settings.openaiMaxTokens = defaults.settings().openaiMaxTokens
            settings.openaiMaxContextTokens = defaults.settings().openaiMaxContextTokens
            settings.openaiMaxContextMessageCount = 8
            break
        case ModelProvider.ChatboxAI:
            settings.openaiMaxTokens = 0
            settings.openaiMaxContextTokens = 8000
            settings.openaiMaxContextMessageCount = 8
            break
        case ModelProvider.ChatGLM6B:
            settings.openaiMaxTokens = 0
            settings.openaiMaxContextTokens = 2000
            settings.openaiMaxContextMessageCount = 4
            break
        case ModelProvider.Claude:
            settings.openaiMaxContextMessageCount = 10
            break
        default:
            break
    }
    return settings
}

/**
 * 根据设置获取模型的 maxTokens、maxContextTokens 的取值范围
 * @param settings
 * @returns
 */
export function getTokenLimits(settings: SessionSettings) {
    let totalTokenLimit = 32 * 1000
    if (settings.aiProvider === ModelProvider.OpenAI && settings.model !== 'custom-model') {
        totalTokenLimit = modelConfigs[settings.model]?.maxTokens || 4000 // 旧版本用户可能依然使用 modelConfigs 中弃用删除的模型，需要兼容 undefined 情况
    }
    const maxContextTokenLimit = Math.floor(totalTokenLimit / 1000) * 1000
    const minContextTokenLimit = 256
    const maxTokenLimit = totalTokenLimit - minContextTokenLimit
    const minTokenLimit = 0
    return {
        maxTokenLimit,
        minTokenLimit,
        maxContextTokenLimit,
        minContextTokenLimit,
        totalTokenLimit,
    }
}
