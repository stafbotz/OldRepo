let sessionwb = './session/userclientwb.json'
let sessionmd = './session/userclientmd.json'
const { WAConnection, MessageType, Presence, MessageOptions, Mimetype, WALocationMessage, WA_MESSAGE_STUB_TYPES, ReconnectMode, ProxyAgent, waChatKey } = require('@adiwajshing/baileys')
const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState } = require('@adiwajshing/baileys-md')
const { state, saveState } = useSingleFileAuthState(sessionmd)
const pino = require('pino')
const { color, bgcolor } = require('../lib/color')
const fs = require('fs-extra')
let multidevice = true

require('../message/chats.js')
nocache('../message/chats.js', module => console.log(module + 'is now updated'))

async function start() {
  if ( multidevice ) {
        client = makeWASocket({ 
           printQRInTerminal: true, 
           logger: pino({ level: 'debug' }),
           auth: state
        })
        client.ev.on('messages.upsert', async (mek) => {
       	if (!mek.messages) return
              mek = mek.messages[0]
              require('../message/chats.js')(client, mek)
        })
        client.ev.on('connection.update', (update) => {
        var { connection, lastDisconnect } = update
        if (connection === 'close') {
            console.log('connection closed, try to restart')
            lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut 
            ? start()
            : console.log('whatsapp web is logged out')
        }
        console.log('connected', update)
    })
    client.ev.on('creds.update', () => saveState)
    return client
  } else {
	client = new WAConnection()
        client.version = [2, 2142, 12]
        client.logger.level = 'warn'
        client.autoReconnect = ReconnectMode.onConnectionLost
        client.on('qr', () => {
           console.log('scan qr')
        })
       fs.existsSync(sessionwb) && client.loadAuthInfo(sessionwb)
       client.on('connecting', () => {
          console.log('connecting')
       })
       client.on('open', () => {
          console.log('connected')
       })
      await client.connect({timeoutMs: 30 * 1000})
      fs.writeFileSync(sessionwb, JSON.stringify(client.base64EncodedAuthInfo(), null, '\t'))
      client.on('chat-update', async (mek) => {
         require('../message/chats.js')(client, mek)
      })
      client.on('ws-close', () => {
        console.log('Connection lost, trying to reconnect')
      })
      client.on('close', async ({ reason, isReconnecting }) => {
        console.log('connection closed, try to restart')
        if (!isReconnecting) {
            console.log('Connect To Phone Rejected and Shutting Down')
      }
   })
}
function nocache(module, cb = () => { }) {
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

start().catch (err => console.log('unexpected error: ' + err))
