import { ModelOptionGroup, Settings } from '../../../shared/types'
import { flatten } from 'lodash'
import * as Sentry from '@sentry/react'
import * as remote from '../../packages/remote'

export default class BaseConfig {
    getLocalOptionGroups(settings: Settings): ModelOptionGroup[] {
        return []
    }

    async getRemoteOptionGroups(settings: Settings): Promise<ModelOptionGroup[]> {
        const modelConfigs = await remote.getModelConfigsWithCache(settings).catch((e) => {
            Sentry.captureException(e)
            return { option_groups: [] as ModelOptionGroup[] }
        })
        return modelConfigs.option_groups
    }

    async getMergeOptionGroups(settings: Settings): Promise<ModelOptionGroup[]> {
        const localOptionGroups = this.getLocalOptionGroups(settings)
        const remoteOptionGroups = await this.getRemoteOptionGroups(settings)
        return this.mergeOptionGroups(localOptionGroups, remoteOptionGroups)
    }

    /**
      * 合并本地与远程的模型选项组。
      * 在返回的选项组中，本地选项组中独有的选项将会出现在第一个选项组，其余选项组将为远程选项组。
      * @param localOptionGroups 本地模型选项组
      * @param remoteOptionGroups 远程模型选项组
      * @returns 
      */
    mergeOptionGroups(localOptionGroups: ModelOptionGroup[], remoteOptionGroups: ModelOptionGroup[]) {
        const ret = [...remoteOptionGroups]
        const remoteOptionValues = flatten(remoteOptionGroups.map(group => group.options.map(option => option.value)))
        const localOptions = flatten(localOptionGroups.map(group => group.options))
        const missedLocalOptions = localOptions.filter(option => !remoteOptionValues.includes(option.value))
        if (missedLocalOptions.length > 0) {
            ret.unshift({
                options: missedLocalOptions
            })
        }
        return ret
    }

}
