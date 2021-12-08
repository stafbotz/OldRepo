const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState } = require('@adiwajshing/baileys-md')
const { state, saveState } = useSingleFileAuthState('./session.json')
const pino = require('pino')
const { color, bgcolor } = require('./lib/color')
const { clientLog } = require('./lib/functions')
const fs = require('fs-extra')

async function start() {
    clientLog('warn', 'make socket a wa web')
    const client = makeWASocket({ 
       printQRInTerminal: true, 
       logger: pino({ level: 'fatal' }),
       auth: state
    })
    clientLog('info', 'start connection to wa web')
    client.ev.on('messages.upsert', async (mek) => {
       if (!mek.messages) return
       const msg = mek.messages[0]
       require('./message/chats.js')(client, msg, mek)
    })
    client.ev.on('connection.update', (update) => {
       const { connection, lastDisconnect } = update
       if (connection === 'close') {
         clientLog('warn', 'connection closed, try to restart')
         lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut 
         ? start()
         : clientLog('err', 'whatsapp web is logged out')
       }
       if (connection === 'connecting') {
         clientLog('info', 'connected to wa web')
         clientLog('info', 'start connection to client')
       }
       if (connection === 'open') {
         clientLog('info', 'opened connection')
         require('./message/broadcast.js')(client)
       }
    })
  client.ev.on('creds.update', () => saveState)
  return client
}

start().catch (err => console.log('unexpected error: ' + err))
