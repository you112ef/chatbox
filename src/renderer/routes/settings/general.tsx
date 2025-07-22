import {
  Alert,
  Button,
  Checkbox,
  Divider,
  FileButton,
  Flex,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { mapValues, uniqBy } from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type Language, type ProviderInfo, type Settings, Theme } from 'src/shared/types'
import LazySlider from '@/components/LazySlider'
import { useSettings } from '@/hooks/useSettings'
import { languageNameMap, languages } from '@/i18n/locales'
import platform from '@/platform'
import storage, { StorageKey } from '@/storage'
import { migrateOnData } from '@/stores/migration'

export const Route = createFileRoute('/settings/general')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation()
  const { settings, setSettings } = useSettings()

  return (
    <Stack p="md" gap="xl">
      <Title order={5}>{t('General Settings')}</Title>

      {/* Display Settings */}
      <Stack gap="md">
        <Title order={5}>{t('Display Settings')}</Title>

        {/* language */}
        <Select
          maw={320}
          comboboxProps={{ withinPortal: true }}
          value={settings.language}
          data={languages.map((language) => ({
            value: language,
            label: languageNameMap[language],
            // style: language === 'ar' ? { fontFamily: 'Cairo, Arial, sans-serif' } : {},
          }))}
          label={t('Language')}
          styles={{
            label: {
              fontWeight: 400,
            },
          }}
          onChange={(val) => {
            if (val) {
              setSettings({
                language: val as Language,
              })
            }
          }}
        />

        {/* theme */}
        <Select
          maw={320}
          comboboxProps={{ withinPortal: true, withArrow: true }}
          label={t('Theme')}
          styles={{
            label: {
              fontWeight: 400,
            },
          }}
          data={[
            { value: `${Theme.System}`, label: t('Follow System') },
            { value: `${Theme.Light}`, label: t('Light Mode') },
            { value: `${Theme.Dark}`, label: t('Dark Mode') },
          ]}
          value={`${settings.theme}`}
          onChange={(val) => {
            if (val) {
              setSettings({
                theme: parseInt(val),
              })
            }
          }}
        />

        {/* Font Size */}
        <Stack>
          <Text>{t('Font Size')}</Text>
          <LazySlider
            step={1}
            min={10}
            max={22}
            maw={320}
            marks={[
              {
                value: 14,
              },
            ]}
            value={settings.fontSize}
            onChange={(val) =>
              setSettings({
                fontSize: val,
              })
            }
          />
        </Stack>

        {/* Startup Page */}
        <Stack>
          <Text>{t('Startup Page')}</Text>
          <Radio.Group
            value={settings.startupPage}
            defaultValue="home"
            onChange={(val) => setSettings({ startupPage: val as any })}
          >
            <Flex gap="md">
              <Radio label={t('Home Page')} value="home" />
              <Radio label={t('Last Session')} value="session" />
            </Flex>
          </Radio.Group>
        </Stack>
      </Stack>

      <Divider />

      {/* Network Proxy */}
      <Stack gap="xs">
        <Title order={5}>{t('Network Proxy')}</Title>
        <TextInput
          maw={320}
          placeholder="socks5://127.0.0.1:6153"
          value={settings.proxy}
          onChange={(e) =>
            setSettings({
              proxy: e.currentTarget.value,
            })
          }
        />
      </Stack>

      <Divider />

      {/* import and export data */}
      <ImportExportDataSection />

      <Divider />

      {/* Error Reporting */}
      <Stack gap="md">
        <Stack gap="xxs">
          <Title order={5}>{t('Error Reporting')}</Title>
          <Text c="chatbox-tertiary">
            {t(
              'Chatbox respects your privacy and only uploads anonymous error data and events when necessary. You can change your preferences at any time in the settings.'
            )}
          </Text>
        </Stack>

        <Checkbox
          label={t('Enable optional anonymous reporting of crash and event data')}
          checked={settings.allowReportingAndTracking}
          onChange={(e) => setSettings({ allowReportingAndTracking: e.target.checked })}
        />
      </Stack>

      {/* others */}
      {platform.type === 'desktop' && (
        <>
          <Divider />

          <Stack gap="xl">
            <Switch
              label={t('Launch at system startup')}
              checked={settings.autoLaunch}
              onChange={(e) =>
                setSettings({
                  autoLaunch: e.currentTarget.checked,
                })
              }
            />
            <Switch
              label={t('Automatic updates')}
              checked={settings.autoUpdate}
              onChange={(e) =>
                setSettings({
                  autoUpdate: e.currentTarget.checked,
                })
              }
            />
            <Switch
              label={t('Beta updates')}
              checked={settings.betaUpdate}
              onChange={(e) =>
                setSettings({
                  betaUpdate: e.currentTarget.checked,
                })
              }
            />
          </Stack>
        </>
      )}
    </Stack>
  )
}

const ImportExportDataSection = () => {
  const { t } = useTranslation()

  const [importTips, setImportTips] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportItems, setExportItems] = useState<ExportDataItem[]>([
    ExportDataItem.Setting,
    ExportDataItem.Conversations,
    ExportDataItem.Copilot,
  ])

  const isLoading = isExporting || isImporting

  const onExport = async () => {
    if (isLoading) return

    setIsExporting(true)
    try {
      const date = new Date()
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

      const streamingDataGenerator = async function* () {
        yield '{'

        let isFirstItem = true

        // 导出metadata
        if (!isFirstItem) yield ','
        yield `"__exported_items":${JSON.stringify(exportItems)}`
        isFirstItem = false

        if (!isFirstItem) yield ','
        yield `"__exported_at":"${date.toISOString()}"`

        // 获取所有存储的keys
        try {
          const allKeys = await storage.getAllKeys()

          for (const key of allKeys) {
            let shouldExport = false

            // 判断是否需要导出这个key
            if (key === StorageKey.Settings && exportItems.includes(ExportDataItem.Setting)) {
              shouldExport = true
            } else if (key.startsWith('session:') && exportItems.includes(ExportDataItem.Conversations)) {
              shouldExport = true
            } else if (key === StorageKey.MyCopilots && exportItems.includes(ExportDataItem.Copilot)) {
              shouldExport = true
            } else if (key === StorageKey.ChatSessionsList && exportItems.includes(ExportDataItem.Conversations)) {
              shouldExport = true
            } else if (key === StorageKey.ChatSessionSettings && exportItems.includes(ExportDataItem.Conversations)) {
              shouldExport = true
            } else if (
              key === StorageKey.PictureSessionSettings &&
              exportItems.includes(ExportDataItem.Conversations)
            ) {
              shouldExport = true
            } else if (key === StorageKey.ConfigVersion) {
              shouldExport = true
            }

            // 跳过不需要导出的key
            if (key === StorageKey.Configs) {
              shouldExport = false // 不导出 uuid
            }

            if (shouldExport) {
              try {
                const value = await storage.getItem(key, null)
                if (value !== null) {
                  // 对settings进行特殊处理，清理敏感数据
                  if (key === StorageKey.Settings) {
                    const cleanedSettings = { ...(value as Settings) }
                    cleanedSettings.licenseDetail = undefined
                    cleanedSettings.licenseInstances = undefined

                    if (!exportItems.includes(ExportDataItem.Key)) {
                      delete cleanedSettings.licenseKey
                      if (cleanedSettings.providers) {
                        cleanedSettings.providers = mapValues(cleanedSettings.providers, (provider: ProviderInfo) => {
                          const cleanedProvider = { ...provider }
                          delete cleanedProvider.apiKey
                          return cleanedProvider
                        }) as unknown as { [key: string]: ProviderInfo }
                      }
                    }

                    yield ','
                    yield `"${key}":${JSON.stringify(cleanedSettings)}`
                  } else {
                    yield ','
                    yield `"${key}":${JSON.stringify(value)}`
                  }
                }
              } catch (error) {
                console.warn(`Failed to export key ${key}:`, error)
              }
            }
          }
        } catch (error) {
          console.error('Failed to get storage keys:', error)
        }

        yield '}'
      }

      await platform.exporter.exportStreamingJson(`chatbox-exported-data-${dateStr}.json`, streamingDataGenerator)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const onImport = (file: File | null) => {
    if (isLoading) return

    const errTip = t('Import failed, unsupported data format')
    if (!file) {
      return
    }

    setIsImporting(true)
    setImportTips('')

    const reader = new FileReader()
    reader.onload = (event) => {
      ;(async () => {
        try {
          const result = event.target?.result
          if (typeof result !== 'string') {
            throw new Error('FileReader result is not string')
          }
          const importData = JSON.parse(result)
          // 如果导入数据中包含了老的版本号，应该仅仅针对老的版本号进行迁移
          await migrateOnData(
            {
              getData: async (key, defaultValue) => {
                return importData[key] || defaultValue
              },
              setData: async (key, value) => {
                importData[key] = value
              },
              setAll: async (data) => {
                Object.assign(importData, data)
              },
            },
            false
          )

          const previousData = await storage.getAll()
          // FIXME: 这里缺少了数据校验
          await storage.setAll({
            ...previousData, // 有时候 importData 在导出时没有包含一些数据，这些数据应该保持原样
            ...importData,
            [StorageKey.ChatSessionsList]: uniqBy(
              [
                ...(previousData[StorageKey.ChatSessionsList] || []),
                ...(importData[StorageKey.ChatSessionsList] || []),
              ],
              'id'
            ),
            // 保持 configVersion 不变
            [StorageKey.ConfigVersion]: previousData[StorageKey.ConfigVersion],
          })
          // 由于即将重启应用，这里不需要清理loading状态
          // props.onCancel() // 导出成功后立即关闭设置窗口，防止用户点击保存、导致设置数据被覆盖
          platform.relaunch() // 重启应用以生效
        } catch (err) {
          setImportTips(errTip)
          setIsImporting(false)
          throw err
        }
      })()
    }
    reader.onerror = (event) => {
      setImportTips(errTip)
      setIsImporting(false)
      const err = event.target?.error
      if (!err) {
        throw new Error('FileReader error but no error message')
      }
      throw err
    }
    reader.readAsText(file)
  }

  return (
    <>
      <Stack gap="md">
        <Title order={5}>{t('Data Backup')}</Title>
        {[
          { label: t('Settings'), value: ExportDataItem.Setting },
          { label: t('API KEY & License'), value: ExportDataItem.Key },
          { label: t('Chat History'), value: ExportDataItem.Conversations },
          { label: t('My Copilots'), value: ExportDataItem.Copilot },
        ].map(({ label, value }) => (
          <Checkbox
            key={value}
            checked={exportItems.includes(value)}
            label={label}
            disabled={isLoading}
            onChange={(e) => {
              const checked = e.currentTarget.checked
              if (checked && !exportItems.includes(value)) {
                setExportItems([...exportItems, value])
              } else if (!checked) {
                setExportItems(exportItems.filter((v) => v !== value))
              }
            }}
          />
        ))}
        <Button className="self-start" onClick={onExport} disabled={isLoading} loading={isExporting}>
          {isExporting ? t('Exporting...') : t('Export Selected Data')}
        </Button>
      </Stack>

      <Divider />

      <Stack gap="lg">
        <Stack gap="xxs">
          <Title order={5}>{t('Data Restore')}</Title>
          <Text c="chatbox-tertiary">
            {t('Upon import, changes will take effect immediately and existing data will be overwritten')}
          </Text>
        </Stack>
        {importTips && (
          <Alert
            className=" self-start"
            variant="light"
            color="yellow"
            title={importTips}
            icon={<IconInfoCircle />}
          ></Alert>
        )}
        <FileButton accept="application/json" onChange={onImport} disabled={isLoading}>
          {(props) => (
            <Button {...props} className="self-start" disabled={isLoading} loading={isImporting}>
              {isImporting ? t('Importing...') : t('Import and Restore')}
            </Button>
          )}
        </FileButton>
      </Stack>
    </>
  )
}

enum ExportDataItem {
  Setting = 'setting',
  Key = 'key',
  Conversations = 'conversations',
  Copilot = 'copilot',
}
