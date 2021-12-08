const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState } = require('@adiwajshing/baileys-md')
const { state, saveState } = useSingleFileAuthState('./session.json')
const pino = require('pino')
const { color, bgcolor } = require('./lib/color')
const fs = require('fs-extra')

async function start() {
    const client = makeWASocket({ 
       printQRInTerminal: true, 
       logger: pino({ level: 'silent' }),
       auth: state
    })
    console.log('start connection to wa web')
    client.ev.on('messages.upsert', async (mek) => {
       if (!mek.messages) return
       const msg = mek.messages[0]
       require('./message/chats.js')(client, msg, mek)
    })
    client.ev.on('connection.update', (update) => {
       const { connection, lastDisconnect } = update
       if (connection === 'close') {
         console.log('connection closed, try to restart')
         lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut 
         ? start()
         : console.log('whatsapp web is logged out')
       }
       console.log('connected to wa web')
       if (connection === 'open') {
         console.log('opened connection')
         require('./message/broadcast.js')(client)
       }
    })
  client.ev.on('creds.update', () => saveState)
  return client
}

start().catch (err => console.log('unexpected error: ' + err))
