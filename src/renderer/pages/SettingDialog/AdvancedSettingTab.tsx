import { useEffect, useState } from 'react'
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
} from '@mui/material'
import * as runtime from '../../packages/runtime'
import { Shortcut } from '../../components/Shortcut'
import { Settings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import { Accordion, AccordionSummary, AccordionDetails } from '../../components/Accordion'
import TextFieldReset from '../../components/TextFieldReset'

interface ModelConfigProps {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
}

export default function AdvancedSettingTab(props: ModelConfigProps) {
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
                        helperText={runtime.isWeb ? t('not available in browser') : null}
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary aria-controls="panel1a-content">
                    <Typography>{t('Shortcuts')}</Typography>
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
        </Box>
    )
}
