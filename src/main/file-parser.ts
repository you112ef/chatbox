// import * as fs from 'fs-extra'
// import log from 'electron-log'
// import officeParser from 'officeparser'
// import { isOfficeFilePath } from '../shared/file-extensions'
// import { sliceTextWithEllipsis } from './util'

// export async function parseFile(filePath: string) {
//     if (isOfficeFilePath(filePath)) {
//         try {
//             const data = await officeParser.parseOfficeAsync(filePath)
//             return sliceTextWithEllipsis(data, 600)
//         } catch (error) {
//             log.error(error)
//             throw error
//         }
//     }
//     const data = await fs.readFile(filePath, 'utf8')
//     return sliceTextWithEllipsis(data, 2000)
// }
