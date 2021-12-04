const { color, bgcolor } = require('../lib/color')
const pino = require('pino')
const fs = require('fs-extra')
let sessionmd = './session/userclientmd.json'
let sessionwb = './session/userclientwb.json'
const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState } = require('@adiwajshing/baileys-md')
const { WAConnection, MessageType, Presence, Mimetype, relayWAMessage, prepareMessageFromContent, GroupSettingChange } = require('@adiwajshing/baileys')
const { state, saveState } = useSingleFileAuthState(sessionmd)
let multidevice = false

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
   }
}

start().catch (err => console.log('unexpected error: ' + err))
