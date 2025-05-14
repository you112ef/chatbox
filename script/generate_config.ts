import fs from 'fs'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { keyBy, pick } from 'lodash'
import { MessageRole, Session, SessionMeta } from 'src/shared/types'

function getSessionMeta(session: SessionMeta) {
  return pick(session, ['id', 'name', 'starred', 'assistantAvatarKey', 'picUrl', 'type'])
}

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

  let configVersion = parseInt(process.argv[4])
  if (isNaN(configVersion)) {
    configVersion = 8
  }

  const str = fs.readFileSync(`./test/data/template-v${configVersion}.json`, 'utf8')
  const config = JSON.parse(str)
  config['configVersion'] = configVersion
  const sessions: Session[] = []
  for (let i = 0; i < sessionNum; i++) {
    const messages = []
    for (let j = 0; j < messageNum; j++) {
      messages.push({
        id: faker.string.uuid(),
        role: faker.helpers.arrayElement(['user', 'assistant']) as MessageRole,
        contentParts: [
          {
            type: 'text' as const,
            text: faker.lorem.lines({ min: 1, max: 5 }),
          },
        ],
      })
    }
    sessions.push({
      id: faker.string.uuid(),
      name: faker.lorem.word(),
      picUrl: faker.image.avatar(),
      messages: messages,
      starred: faker.datatype.boolean(),
    })
  }
  if (configVersion === 7) {
    config['chat-sessions'] = sessions
  } else {
    config['chat-sessions-list'] = sessions.map((session) => getSessionMeta(session))
    config['chat-sessions'] = keyBy(sessions, (s) => `session:${s.id}`)
  }

  const output = JSON.stringify(config)

  const outputPath = './tmp/generate_config/config.json'
  fs.writeFileSync(outputPath, output)

  console.log(`sessionNum: ${sessionNum}, messageNum: ${messageNum}, size: ${(output.length / 1000 / 1024).toFixed(2)}M`)
  console.log(`outputPath: ${outputPath}`)
}
