const fs = require('fs')
const { faker } = require('@faker-js/faker/locale/zh_CN')

main()
function main() {
    let sessionNum = parseInt(process.argv[2])
    if (isNaN(sessionNum)) {
        sessionNum = 4
    }
    let messageNum = parseInt(process.argv[3])
    if (isNaN(messageNum)) {
        messageNum = 100
    }

    const str = fs.readFileSync('./tmp/generate_config/template.json', 'utf8')
    const config = JSON.parse(str)
    config['chat-sessions'] = []
    for (let i = 0; i < sessionNum; i++) {
        const messages = []
        for (let j = 0; j < messageNum; j++) {
            messages.push({
                id: faker.string.uuid(),
                content: faker.lorem.lines({ min: 1, max: 5 }),
                role: faker.helpers.arrayElement(['user', 'assistant']),
            })
            config['chat-sessions'].push({
                id: faker.string.uuid(),
                picUrl: faker.image.avatar(),
                messages: messages,
                starred: faker.datatype.boolean(),
            })
        }
    }

    const output = JSON.stringify(config)

    const outputPath = './tmp/generate_config/config.json'
    fs.writeFileSync(outputPath, output)

    console.log(`sessionNum: ${sessionNum}, messageNum: ${messageNum}, size: ${output.length / 1000 / 1024}M`)
    console.log(`outputPath: ${outputPath}`)
}

// export interface Session {
//     id: string
//     name: string
//     picUrl?: string
//     messages: Message[]
//     starred?: boolean
//     copilotId?: string
//     settings?: ModelSettings
// }

// export type Message = OpenAIMessage & {
//     id: string
//     cancel?: () => void
//     generating?: boolean
//     aiProvider?: ModelProvider
//     model?: string

//     error?: string
//     errorExtra?: {
//         [key: string]: any
//     }

//     wordCount?: number // 当前消息的字数
//     tokenCount?: number // 当前消息的 token 数量
//     tokensUsed?: number // 生成当前消息的 token 使用量
// }
