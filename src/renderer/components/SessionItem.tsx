import React, { useState, useMemo } from 'react'
import { useSetAtom } from 'jotai'
import { ListItemText, MenuItem, Divider, Avatar, IconButton, Typography, ListItemIcon } from '@mui/material'
import { Session } from '../../shared/types'
import CopyIcon from '@mui/icons-material/CopyAll'
import EditIcon from '@mui/icons-material/Edit'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import StyledMenu from './StyledMenu'
import { useTranslation } from 'react-i18next'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import ImageIcon from '@mui/icons-material/Image'
import * as sessionActions from '../stores/sessionActions'
import * as atoms from '@/stores/atoms'

export interface Props {
    session: Session
    selected: boolean
}

function _SessionItem(props: Props) {
    const { session, selected } = props
    const { t } = useTranslation()
    const setChatConfigDialogSession = useSetAtom(atoms.chatConfigDialogAtom)
    const [hovering, setHovering] = useState(false)
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        event.preventDefault()
        setAnchorEl(event.currentTarget)
    }
    const handleMenuClose = () => {
        setAnchorEl(null)
    }
    const onClick = () => {
        sessionActions.switchCurrentSession(session.id)
    }
    return (
        <>
            <MenuItem
                key={session.id}
                selected={selected}
                onClick={onClick}
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
                    <IconButton color={session.type === 'picture' ? 'secondary' : 'inherit'} onClick={onClick}>
                        {session.picUrl ? (
                            <Avatar sizes="20px" sx={{ width: '20px', height: '20px' }} src={session.picUrl} />
                        ) : session.type === 'picture' ? (
                            <ImageIcon fontSize="small" />
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
                    <IconButton onClick={handleMenuClick} sx={{ color: 'primary.main' }}>
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
                onClose={handleMenuClose}
            >
                <MenuItem
                    key={session.id + 'edit'}
                    onClick={() => {
                        setChatConfigDialogSession(session)
                        handleMenuClose()
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
                        handleMenuClose()
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
                        handleMenuClose()
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
                        handleMenuClose()
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
    }, [props.session, props.selected])
}
