import SettingDialog from './SettingDialog'
import ChatConfigWindow from './ChatConfigWindow'
import CleanWidnow from './CleanWindow'
import AboutWindow from './AboutWindow'
import CopilotWindow from './CopilotWindow'
import RemoteDialogWindow from './RemoteDialogWindow'
import ClearConversationListWindow from './ClearConversationListWindow'
import SearchDialog from './SearchDialog'
import ExportChatDialog from './ExportChatDialog'
import PictureDialog from './PictureDialog'
import MessageEditDialog from './MessageEditDialog'
import WelcomeDialog from './WelcomeDialog'
import ArtifactDialog from './ArtifactDialog'
import MermaidDialog from './MermaidDialog'

export default function Dialogs() {
    return (
        <>
            <SettingDialog />
            <AboutWindow />
            <ChatConfigWindow />
            <CleanWidnow />
            <CopilotWindow />
            <RemoteDialogWindow />
            <ClearConversationListWindow />
            <SearchDialog />
            <ExportChatDialog />
            <PictureDialog />
            <MessageEditDialog />
            <WelcomeDialog />
            <ArtifactDialog />
            <MermaidDialog />
        </>
    )
}
