import { ModelOptionGroup, Settings } from '../../../shared/types'
import * as Sentry from '@sentry/react'
import * as remote from '../../packages/remote'

export default class BaseConfig {
  public getLocalOptionGroups(settings: Settings): ModelOptionGroup[] {
    return []
  }

  protected async getRemoteOptionGroups(settings: Settings): Promise<ModelOptionGroup[]> {
    const modelConfigs = await remote.getModelConfigsWithCache(settings).catch((e) => {
      Sentry.captureException(e)
      return { option_groups: [] as ModelOptionGroup[] }
    })
    return modelConfigs.option_groups
  }

  public async getMergeOptionGroups(settings: Settings): Promise<ModelOptionGroup[]> {
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
  protected mergeOptionGroups(localOptionGroups: ModelOptionGroup[], remoteOptionGroups: ModelOptionGroup[]) {
    const ret = [...localOptionGroups, ...remoteOptionGroups]
    const existedOptionSet = new Set<string>()
    for (const group of ret) {
      group.options = group.options.filter((option) => {
        const existed = existedOptionSet.has(option.value)
        existedOptionSet.add(option.value)
        return !existed
      })
    }
    return ret.filter((group) => group.options.length > 0)
  }

  getCurrentModelOptionValue(settings: Settings) {
    return ''
  }

  isCurrentModelSupportWebBrowsing(settings: Settings): boolean {
    return false
  }
}
