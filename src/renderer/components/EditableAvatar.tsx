import { Badge, Box, IconButton, useTheme } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import Avatar from '@mui/material/Avatar'
import React, { useRef } from 'react'
import storage from '@/storage'
import { SxProps } from "@mui/system";
import { Theme } from "@mui/material/styles";

interface Props {
    children: React.ReactNode
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    sx?: SxProps<Theme>
}

export default function EditableAvatar(props: Props) {
    const theme = useTheme()
    const avatarInputRef = useRef<HTMLInputElement | null>(null)

    const onAvatarUpload = () => {
        avatarInputRef.current?.click()
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                paddingBottom: '15px',
            }}
        >
            <input
                type="file"
                ref={avatarInputRef}
                className="hidden"
                onChange={props.onChange}
                accept="image/png, image/jpeg"
            />
            <Badge
                overlap="circular"
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                badgeContent={
                    <IconButton
                        onClick={onAvatarUpload}
                        edge={'end'}
                        size={'small'}
                        sx={{
                            backgroundColor: theme.palette.warning.main,
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
                        ...props.sx,
                    }}
                    className="cursor-pointer"
                    onClick={onAvatarUpload}
                >
                    {props.children}
                </Avatar>
            </Badge>
        </Box>
    )
}
