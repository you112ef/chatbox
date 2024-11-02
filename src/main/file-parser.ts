import * as fs from 'fs-extra'
import log from 'electron-log'
import officeParser from 'officeparser'
import { isOfficeFile } from '../shared/file-extensions'

export async function parseFile(filePath: string) {
    if (isOfficeFile(filePath)) {
        try {
            const data = await officeParser.parseOfficeAsync(filePath)
            return data
        } catch (error) {
            log.error(error)
            throw error
        }
    }
    return fs.readFile(filePath, 'utf8')
}
