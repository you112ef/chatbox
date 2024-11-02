import * as fs from 'fs-extra'
import log from 'electron-log'
import officeParser from 'officeparser'
import { isOfficeFile } from '../shared/file-extensions'

export async function parseFile(filePath: string) {
    if (isOfficeFile(filePath)) {
        try {
            const data = await officeParser.parseOfficeAsync(filePath)
            return data.slice(0, 600)
        } catch (error) {
            log.error(error)
            throw error
        }
    }
    const data = await fs.readFile(filePath, 'utf8')
    return data.slice(0, 2000)
}
