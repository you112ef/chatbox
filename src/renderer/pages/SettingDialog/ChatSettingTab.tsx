import { Button, TextField, Box, FormControlLabel, Switch, FormGroup, Badge, IconButton, useTheme } from '@mui/material'
import { Settings } from '../../../shared/types'
import { useTranslation } from 'react-i18next'
import * as defaults from '../../../shared/defaults'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import React, { useRef } from "react";
import {v4 as uuidv4} from "uuid";
import storage from "@/storage";
import { ImageInStorage } from "@/components/Image";
import PersonIcon from "@mui/icons-material/Person";
import Avatar from "@mui/material/Avatar";
import EditIcon from "@mui/icons-material/Edit";

export default function ChatSettingTab(props: {
    settingsEdit: Settings
    setSettingsEdit: (settings: Settings) => void
}) {
    const theme = useTheme()
    const { settingsEdit, setSettingsEdit } = props
    const { t } = useTranslation()
    const isSmallScreen = useIsSmallScreen()
    const userAvatarInputRef = useRef<HTMLInputElement | null>(null)

    const onUserAvatarInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) {
            return
        }
        const file = event.target.files[0]
        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = async (e) => {
                if (e.target && e.target.result) {
                    const base64 = e.target.result as string
                    const key = `picture:user-avatar:${uuidv4()}`
                    await storage.setBlob(key, base64)
                    setSettingsEdit({
                        ...settingsEdit,
                        userAvatarKey: key,
                    })
                }
            }
            reader.readAsDataURL(file)
        }
        event.target.value = ''
    }

    const onUserAvatarUpload = () => {
        userAvatarInputRef.current?.click()
    }

    return (
        <Box>
            <Box className='mb-2'>
                <input type='file' ref={userAvatarInputRef} className='hidden' onChange={onUserAvatarInputChange}
                       accept="image/png, image/jpeg"
                />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        paddingBottom: '15px',
                    }}
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        badgeContent={
                            <IconButton
                                onClick={onUserAvatarUpload}
                                edge={'end'}
                                size={'small'}
                                sx={{
                                    backgroundColor: theme.palette.primary.main,
                                    color: theme.palette.primary.contrastText,
                                    padding: 0.4,
                                    top: 1,
                                    left: 1,
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        }
                    >
                        <Avatar
                            sx={{
                                width: '80px',
                                height: '80px',
                            }}
                            onClick={onUserAvatarUpload}
                        >
                            {
                                settingsEdit.userAvatarKey ? (
                                    <ImageInStorage storageKey={settingsEdit.userAvatarKey}
                                                    className='object-cover object-center w-full h-full' />
                                ) : (
                                    <PersonIcon fontSize='small' />
                                )
                            }
                        </Avatar>
                    </Badge>
                </Box>
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
        </Box>
    )
}
