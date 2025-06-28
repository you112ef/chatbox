import platform from '../platform'

;(async () => {
  try {
    const settings = await platform.getSettings()
    if (!settings.allowReportingAndTracking) {
      return
    }

    const version = await platform.getVersion().catch(() => 'unknown')

    // 设置 Plausible 全局属性
    if (window.plausible) {
      // 为所有后续的 pageview 和事件设置默认属性
      const originalPlausible = window.plausible
      const enhancedPlausible = (event: string, options?: { props?: Record<string, unknown> }) => {
        const enhancedOptions = {
          ...options,
          props: {
            ...options?.props,
            version,
          },
        }
        return originalPlausible(event, enhancedOptions)
      }

      // 复制原始函数的队列属性
      if ('q' in originalPlausible && (originalPlausible as unknown as { q: unknown[] }).q) {
        ;(enhancedPlausible as unknown as { q: unknown[] }).q = (originalPlausible as unknown as { q: unknown[] }).q
      }

      window.plausible = enhancedPlausible
    }
  } catch (e) {
    console.error('Failed to initialize Plausible with version:', e)
  }
})()
