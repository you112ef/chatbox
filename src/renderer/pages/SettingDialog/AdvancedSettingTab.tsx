import { useEffect, useState, useRef } from 'react'
import {
    Typography,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Switch,
    Box,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button,
    Tabs,
    Tab,
    useTheme,
} from '@mui/material'
import * as runtime from '../../packages/runtime'
import { Shortcut } from '../../components/Shortcut'
import { Settings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TextFieldReset from '../../components/TextFieldReset'
import storage, { StorageKey } from '../../storage'

interface Props {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
    onCancel: () => void
}

export default function AdvancedSettingTab(props: Props) {
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const [alt, setAlt] = useState('Alt')
    useEffect(() => {
        ;(async () => {
            const platform = await runtime.getPlatform()
            if (platform === 'darwin') {
                setAlt('Option')
            }
        })()
    }, [])
    return (
        <Box>
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>{t('Network Proxy')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TextFieldReset
                        label={t('Proxy Address')}
                        value={settingsEdit.proxy || ''}
                        setValue={(value) => {
                            setSettingsEdit({ ...settingsEdit, proxy: value })
                        }}
                        placeholder="socks5://127.0.0.1:6153"
                        autoFocus
                        disabled={runtime.isWeb}
                        className="cursor-not-allowed"
                        helperText={
                            runtime.isWeb ? <span className="text-red-600">{t('not available in browser')}</span> : null
                        }
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>{t('Keyboard Shortcuts')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('Description')}</TableCell>
                                    <TableCell align="center">{t('Key Combination')}</TableCell>
                                    <TableCell align="center">{t('Toggle')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell component="th" scope="row">
                                        {t('Show/Hide Application Window')}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Shortcut keys={[alt, '`']} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Switch
                                            size="small"
                                            checked={!props.settingsEdit.disableQuickToggleShortcut}
                                            onChange={(e) =>
                                                props.setSettingsEdit({
                                                    ...props.settingsEdit,
                                                    disableQuickToggleShortcut: !e.target.checked,
                                                })
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                                {[
                                    { description: t('Navigate to Next Conversation'), keys: ['Ctrl', 'Tab'] },
                                    {
                                        description: t('Navigate to Previous Conversation'),
                                        keys: ['Ctrl', 'Shift', 'Tab'],
                                    },
                                    {
                                        description: t('Navigate to Specific Conversation'),
                                        keys: ['Ctrl', t('any number key')],
                                    },
                                    { description: t('Create New Conversation'), keys: ['Ctrl', 'N'] },
                                    { description: t('Focus on Input Box'), keys: ['Ctrl', 'I'] },
                                    { description: t('Send'), keys: [t('Enter')] },
                                    { description: t('Insert New Line in Input Box'), keys: ['Shift', t('Enter')] },
                                    { description: t('Send Without Generating Response'), keys: ['Ctrl', t('Enter')] },
                                    { description: t('Show/Hide Search Dialog'), keys: ['Ctrl', 'K'] },
                                    {
                                        description: t('Navigate to previous option (within search dialog)'),
                                        keys: ['↑'],
                                    },
                                    { description: t('Navigate to next option (within search dialog)'), keys: ['↓'] },
                                    {
                                        description: t('Select current option (within search dialog)'),
                                        keys: [t('Enter')],
                                    },
                                ].map((item, ix) => (
                                    <TableRow key={ix}>
                                        <TableCell component="th" scope="row">
                                            {item.description}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Shortcut keys={item.keys} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Switch size="small" checked disabled />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>{t('Data Backup and Restore')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <ExportAndImport onCancel={props.onCancel} />
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

enum ExportDataItem {
    Setting = 'setting',
    Key = 'key',
    Conversations = 'conversations',
    Copilot = 'copilot',
}

function ExportAndImport(props: { onCancel: () => void }) {
    const { t } = useTranslation()
    const theme = useTheme()
    const [tab, setTab] = useState<'export' | 'import'>('export')
    const [exportItems, setExportItems] = useState<ExportDataItem[]>([
        ExportDataItem.Setting,
        ExportDataItem.Conversations,
        ExportDataItem.Copilot,
    ])
    const importInputRef = useRef<HTMLInputElement>(null)
    const [importTips, setImportTips] = useState('')
    const onExport = async () => {
        const data = await storage.getAll()
        delete data[StorageKey.Configs] // 不导出 uuid
        ;(data[StorageKey.Settings] as Settings).licenseDetail = undefined // 不导出license认证数据
        ;(data[StorageKey.Settings] as Settings).licenseInstances = undefined // 不导出license设备数据，导入数据的新设备也应该计入设备数
        if (!exportItems.includes(ExportDataItem.Key)) {
            delete (data[StorageKey.Settings] as Settings).licenseKey
            ;(data[StorageKey.Settings] as Settings).openaiKey = ''
            ;(data[StorageKey.Settings] as Settings).azureApikey = ''
            ;(data[StorageKey.Settings] as Settings).claudeApiKey = ''
        }
        if (!exportItems.includes(ExportDataItem.Setting)) {
            delete data[StorageKey.Settings]
        }
        if (!exportItems.includes(ExportDataItem.Conversations)) {
            delete data[StorageKey.ChatSessions]
        }
        if (!exportItems.includes(ExportDataItem.Copilot)) {
            delete data[StorageKey.MyCopilots]
        }
        const date = new Date()
        data['__exported_items'] = exportItems
        data['__exported_at'] = date.toISOString()
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        runtime.exportTextFile(`chatbox-exported-data-${dateStr}.json`, JSON.stringify(data))
    }
    const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const errTip = t('Import failed, unsupported data format')
        const file = e.target.files?.[0]
        if (!file) {
            return
        }
        const reader = new FileReader()
        reader.onload = (event) => {
            ;(async () => {
                setImportTips('')
                try {
                    let result = event.target?.result
                    if (typeof result !== 'string') {
                        throw new Error('FileReader result is not string')
                    }
                    const json = JSON.parse(result)
                    // FIXME: 这里缺少了数据校验
                    await storage.setAll(json)
                    props.onCancel() // 导出成功后立即关闭设置窗口，防止用户点击保存、导致设置数据被覆盖
                    runtime.relaunch() // 重启应用以生效
                } catch (err) {
                    setImportTips(errTip)

                    throw err
                }
            })()
        }
        reader.onerror = (event) => {
            setImportTips(errTip)
            const err = event.target?.error
            if (!err) {
                throw new Error('FileReader error but no error message')
            }
            throw err
        }
        reader.readAsText(file)
    }
    return (
        <Box
            sx={{
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
            }}
            className="p-4"
        >
            <Tabs value={tab} onChange={(_, value) => setTab(value)} className="mb-4">
                <Tab
                    value="export"
                    label={<span className="inline-flex justify-center items-center">{t('Data Backup')}</span>}
                />
                <Tab
                    value="import"
                    label={<span className="inline-flex justify-center items-center">{t('Data Restore')}</span>}
                />
            </Tabs>
            {tab === 'export' && (
                <Box sx={{}}>
                    <FormGroup className="mb-2">
                        {[
                            { label: t('Settings'), value: ExportDataItem.Setting },
                            { label: t('API KEY & License'), value: ExportDataItem.Key },
                            { label: t('Chat History'), value: ExportDataItem.Conversations },
                            { label: t('My Copilots'), value: ExportDataItem.Copilot },
                        ].map((item) => (
                            <FormControlLabel
                                label={item.label}
                                control={
                                    <Checkbox
                                        checked={exportItems.includes(item.value)}
                                        onChange={(e, checked) => {
                                            if (checked && !exportItems.includes(item.value)) {
                                                setExportItems([...exportItems, item.value])
                                            } else if (!checked) {
                                                setExportItems(exportItems.filter((v) => v !== item.value))
                                            }
                                        }}
                                    />
                                }
                            />
                        ))}
                    </FormGroup>
                    <Button variant="contained" color="primary" onClick={onExport}>
                        {t('Export Selected Data')}
                    </Button>
                </Box>
            )}
            {tab === 'import' && (
                <Box>
                    <Box className="p-1">
                        {t('Upon import, changes will take effect immediately and existing data will be overwritten')}
                    </Box>
                    {importTips && <Box className="p-1 text-red-600">{importTips}</Box>}
                    <input style={{ display: 'none' }} type="file" ref={importInputRef} onChange={onImport} />
                    <Button variant="contained" color="primary" onClick={() => importInputRef.current?.click()}>
                        {t('Import and Restore')}
                    </Button>
                </Box>
            )}
        </Box>
    )
}
