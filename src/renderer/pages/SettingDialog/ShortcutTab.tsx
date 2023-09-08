import React, { useEffect } from 'react'
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Switch, Box } from '@mui/material'
import { Settings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import * as runtime from '../../packages/runtime'
import { Shortcut } from '../../components/Shortcut'

export default function ShortcutTab(props: { settingsEdit: Settings; setSettingsEdit: (settings: Settings) => void }) {
    const { t } = useTranslation()
    const [alt, setAlt] = React.useState('Alt')
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
                            { description: t('Navigate to Previous Conversation'), keys: ['Ctrl', 'Shift', 'Tab'] },
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
        </Box>
    )
}
