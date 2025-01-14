import {
    Button,
    TextField,
    Box,
    FormControlLabel,
    Switch,
    FormGroup,
    Grid,
    Stack,
    useTheme,
    Tooltip,
} from '@mui/material'
import { Settings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import * as defaults from '../../../shared/defaults'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { v4 as uuidv4 } from 'uuid'
import PersonIcon from '@mui/icons-material/Person'
import EditableAvatar from '@/components/EditableAvatar'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { ImageInStorage, handleImageInputAndSave } from '@/components/Image'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'

export default function ChatSettingTab(props: {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
}) {
    const theme = useTheme()
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()

    return (
        <Box>
            <Box className="mb-2">
                <Grid
                    container
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        paddingBottom: '15px',
                    }}
                >
                    <Grid item xs={5.9}>
                        <Stack>
                            <Tooltip title={t('Edit user avatar')} placement={'top'}>
                                <Box>
                                    <EditableAvatar
                                        onChange={(event) => {
                                            const key = `picture:user-avatar:${uuidv4()}`
                                            handleImageInputAndSave(event, key, () =>
                                                setSettingsEdit({ ...settingsEdit, userAvatarKey: key })
                                            )
                                        }}
                                        onRemove={() => {
                                            setSettingsEdit({ ...settingsEdit, userAvatarKey: undefined })
                                        }}
                                        removable={!!settingsEdit.userAvatarKey}
                                    >
                                        {settingsEdit.userAvatarKey ? (
                                            <ImageInStorage
                                                storageKey={settingsEdit.userAvatarKey}
                                                className="object-cover object-center w-full h-full"
                                            />
                                        ) : (
                                            <PersonIcon fontSize="large" />
                                        )}
                                    </EditableAvatar>
                                </Box>
                            </Tooltip>
                        </Stack>
                    </Grid>
                    <Box
                        sx={{
                            borderLeft: 1,
                            borderColor: 'divider',
                        }}
                    />
                    <Grid item xs={5.9}>
                        <Stack>
                            <Tooltip title={t('Edit default assistant avatar')} placement={'top'}>
                                <Box>
                                    <EditableAvatar
                                        onChange={(event) => {
                                            const key = `picture:default-assistant-avatar:${uuidv4()}`
                                            handleImageInputAndSave(event, key, () =>
                                                setSettingsEdit({ ...settingsEdit, defaultAssistantAvatarKey: key })
                                            )
                                        }}
                                        onRemove={() => {
                                            setSettingsEdit({ ...settingsEdit, defaultAssistantAvatarKey: undefined })
                                        }}
                                        removable={!!settingsEdit.defaultAssistantAvatarKey}
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                        }}
                                    >
                                        {settingsEdit.defaultAssistantAvatarKey ? (
                                            <ImageInStorage
                                                storageKey={settingsEdit.defaultAssistantAvatarKey}
                                                className="object-cover object-center w-full h-full"
                                            />
                                        ) : (
                                            <SmartToyIcon fontSize="large" />
                                        )}
                                    </EditableAvatar>
                                </Box>
                            </Tooltip>
                        </Stack>
                    </Grid>
                </Grid>
                <TextField
                    autoFocus={!isSmallScreen}
                    margin="dense"
                    label={t('Default Prompt for New Conversation')}
                    fullWidth
                    variant="outlined"
                    value={settingsEdit.defaultPrompt || ''}
                    multiline
                    maxRows={8}
                    onChange={(e) =>
                        setSettingsEdit({
                            ...settingsEdit,
                            defaultPrompt: e.target.value,
                        })
                    }
                />
                <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    sx={{ opacity: 0.5, textTransform: 'none' }}
                    onClick={() => {
                        setSettingsEdit({
                            ...settingsEdit,
                            defaultPrompt: defaults.getDefaultPrompt(),
                        })
                    }}
                >
                    {t('Reset to Default')}
                </Button>
            </Box>

            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={t('Auto-Generate Chat Titles')}
                    checked={settingsEdit.autoGenerateTitle}
                    onChange={(e, checked) => {
                        setSettingsEdit({
                            ...settingsEdit,
                            autoGenerateTitle: checked,
                        })
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={t('Spell Check')}
                    checked={settingsEdit.spellCheck}
                    onChange={(e, checked) => {
                        setSettingsEdit({
                            ...settingsEdit,
                            spellCheck: checked,
                        })
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={t('Markdown Rendering')}
                    checked={settingsEdit.enableMarkdownRendering}
                    onChange={(e, checked) => {
                        settingsEdit.enableMarkdownRendering = checked
                        settingsEdit.enableLaTeXRendering = checked
                        setSettingsEdit({ ...settingsEdit })
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={t('LaTeX Rendering (Requires Markdown)')}
                    checked={settingsEdit.enableLaTeXRendering}
                    onChange={(e, checked) => {
                        settingsEdit.enableLaTeXRendering = checked
                        if (checked) {
                            settingsEdit.enableMarkdownRendering = true
                        }
                        setSettingsEdit({ ...settingsEdit })
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={t('Mermaid Diagrams & Charts Rendering')}
                    checked={settingsEdit.enableMermaidRendering}
                    onChange={(e, checked) => {
                        settingsEdit.enableMermaidRendering = checked
                        setSettingsEdit({ ...settingsEdit })
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={
                        <span className="flex items-start justify-center">
                            {t('Inject default metadata')}
                            <Tooltip
                                title={t('e.g., Model Name, Current Date')}
                                className="cursor-pointer"
                                placement="top"
                            >
                                <HelpOutlineIcon className="opacity-60 ml-0.5" fontSize="small" />
                            </Tooltip>
                        </span>
                    }
                    checked={settingsEdit.injectDefaultMetadata}
                    onChange={(e, checked) => {
                        settingsEdit.injectDefaultMetadata = checked
                        setSettingsEdit({ ...settingsEdit })
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormControlLabel
                    control={<Switch />}
                    label={
                        <span className="flex items-start justify-center">
                            {t('Auto-preview artifacts')}
                            <Tooltip
                                title={t(
                                    'Automatically render generated artifacts (e.g., HTML with CSS, JS, Tailwind)'
                                )}
                                className="cursor-pointer"
                                placement="top"
                            >
                                <HelpOutlineIcon className="opacity-60 ml-0.5" fontSize="small" />
                            </Tooltip>
                        </span>
                    }
                    checked={settingsEdit.autoPreviewArtifacts}
                    onChange={(e, checked) => {
                        settingsEdit.autoPreviewArtifacts = checked
                        setSettingsEdit({ ...settingsEdit })
                    }}
                />
                <FormControlLabel
                    control={<Switch />}
                    label={
                        <span className="flex items-start justify-center">
                            {t('Paste long text as a file')}
                            <Tooltip
                                title={t(
                                    'Pasting long text will automatically insert it as a file, keeping chats clean and reducing token usage with prompt caching.'
                                )}
                                className="cursor-pointer"
                                placement="top"
                            >
                                <HelpOutlineIcon className="opacity-60 ml-0.5" fontSize="small" />
                            </Tooltip>
                        </span>
                    }
                    checked={settingsEdit.pasteLongTextAsAFile}
                    onChange={(e, checked) => {
                        settingsEdit.pasteLongTextAsAFile = checked
                        setSettingsEdit({ ...settingsEdit })
                    }}
                />
            </FormGroup>
        </Box>
    )
}
