import React, { useState, useMemo } from 'react'
import { ListItemText, MenuItem, Divider, Avatar, IconButton, Typography, ListItemIcon } from '@mui/material'
import { Session } from '../shared/types'
import CopyIcon from '@mui/icons-material/CopyAll'
import EditIcon from '@mui/icons-material/Edit'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import StyledMenu from './StyledMenu'
import { useTranslation } from 'react-i18next'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import * as sessionActions from './stores/sessionActions'

export interface Props {
    session: Session
    selected: boolean
    setConfigureChatConfig: (session: Session) => void
}

function _SessionItem(props: Props) {
    const { session, selected, setConfigureChatConfig } = props
    const { t } = useTranslation()
    const [hovering, setHovering] = useState(false)
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        event.preventDefault()
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
        setAnchorEl(null)
    }
    return (
        <>
            <MenuItem
                key={session.id}
                selected={selected}
                onClick={() => {
                    sessionActions.switchCurrentSession(session.id)
                }}
                onMouseEnter={() => {
                    setHovering(true)
                }}
                onMouseOver={() => {
                    setHovering(true)
                }}
                onMouseLeave={() => {
                    setHovering(false)
                }}
                sx={{ padding: '0.1rem', margin: '0.1rem' }}
            >
                <ListItemIcon>
                    <IconButton>
                        {session.picUrl ? (
                            <Avatar sizes="20px" sx={{ width: '20px', height: '20px' }} src={session.picUrl} />
                        ) : (
                            <ChatBubbleOutlineOutlinedIcon fontSize="small" />
                        )}
                    </IconButton>
                </ListItemIcon>
                <ListItemText>
                    <Typography variant="inherit" noWrap>
                        {session.name}
                    </Typography>
                </ListItemText>
                {
                    <IconButton onClick={handleClick} sx={{ color: 'primary.main' }}>
                        {session.starred ? (
                            <StarIcon fontSize="small" />
                        ) : (
                            hovering && <MoreHorizOutlinedIcon fontSize="small" />
                        )}
                    </IconButton>
                }
            </MenuItem>
            <StyledMenu
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem
                    key={session.id + 'edit'}
                    onClick={() => {
                        setConfigureChatConfig(session)
                        handleClose()
                    }}
                    disableRipple
                >
                    <EditIcon fontSize="small" />
                    {t('edit')}
                </MenuItem>

                <MenuItem
                    key={session.id + 'copy'}
                    onClick={() => {
                        sessionActions.copy(session)
                        handleClose()
                    }}
                    disableRipple
                >
                    <CopyIcon fontSize="small" />
                    {t('copy')}
                </MenuItem>
                <MenuItem
                    key={session.id + 'star'}
                    onClick={() => {
                        sessionActions.modify({
                            ...session,
                            starred: !session.starred,
                        })
                        handleClose()
                    }}
                    disableRipple
                >
                    {session.starred ? (
                        <>
                            <StarOutlineIcon fontSize="small" />
                            {t('unstar')}
                        </>
                    ) : (
                        <>
                            <StarIcon fontSize="small" />
                            {t('star')}
                        </>
                    )}
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem
                    key={session.id + 'del'}
                    onClick={() => {
                        setAnchorEl(null)
                        handleClose()
                        sessionActions.remove(session)
                    }}
                    disableRipple
                >
                    <DeleteIcon fontSize="small" />
                    {t('delete')}
                </MenuItem>
            </StyledMenu>
        </>
    )
}

export default function Session(props: Props) {
    return useMemo(() => {
        return <_SessionItem {...props} />
    }, [props.session, props.selected, props.setConfigureChatConfig])
}
