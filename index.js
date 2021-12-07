const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState } = require('@adiwajshing/baileys-md')
const { state, saveState } = useSingleFileAuthState('./session.json')
const pino = require('pino')
const { color, bgcolor } = require('./lib/color')
const fs = require('fs-extra')

async function start() {

    require('./message/chats.js')
    nocache('./message/chats.js', module => console.log(module + 'is now updated'))

    const client = makeWASocket({ 
       printQRInTerminal: true, 
       logger: pino({ level: 'debug' }),
       auth: state
    })
    /*client.ev.on('messages.upsert', async (mek) => {
       if (!mek.messages) return
       const msg = mek.messages[0]
       require('./message/chats.js')(client, msg, mek)
    })*/
    client.ev.on('connection.update', (update) => {
       const { connection, lastDisconnect } = update
       if (connection === 'close') {
         console.log('connection closed, try to restart')
         lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut 
         ? start()
         : console.log('whatsapp web is logged out')
       }
       if (connection === 'open') {
         console.log('opened connection')
       }
    })
client.ev.on('creds.update', () => saveState)
return client
  
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
}

start().catch (err => console.log('unexpected error: ' + err))
