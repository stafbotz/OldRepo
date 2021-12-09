// Module
const { default: makeWASocket, BufferJSON, initInMemoryKeyStore, DisconnectReason, AnyMessageContent, delay, useSingleFileAuthState, downloadContentFromMessage } = require('@adiwajshing/baileys-md')
const { state, saveState } = useSingleFileAuthState('./session.json')
const pino = require('pino')
const { color, bgcolor } = require('./lib/color')
const { h2k, getBuffer, randomBytes, generateMessageID, getGroupAdmins, getRandom, clientLog } = require('./lib/functions')
const fs = require('fs-extra')
const axios = require('axios')
const moment = require('moment-timezone')
const { exec, spawn } = require('child_process')

moment.tz.setDefault('Asia/Jakarta').locale('id')

// Database
const antilink = JSON.parse(fs.readFileSync('./database/antilink.json'))
const registered = JSON.parse(fs.readFileSync('./database/registered.json'))

async function start() {
    clientLog('warn', 'make socket a wa web')
    const client = makeWASocket({ 
       printQRInTerminal: true, 
       logger: pino({ level: 'debug' }),
       auth: state
    })
    clientLog('info', 'start connection to wa web')
    client.ev.on('messages.upsert', async (mek) => {
       try {
             if (!mek.messages) return
             const msg = mek.messages[0]
             const content = JSON.stringify(msg.message)
             const type = Object.keys(msg.message)[0]
             const body = (type === 'conversation' && msg.message.conversation.startsWith('')) ? msg.message.conversation : (type == 'imageMessage') && msg.message.imageMessage.caption.startsWith('') ? msg.message.imageMessage.caption : (type == 'documentMessage') && msg.message.documentMessage.caption.startsWith('') ? msg.message.documentMessage.caption : (type == 'videoMessage') && msg.message.videoMessage.caption.startsWith('') ? msg.message.videoMessage.caption : (type == 'extendedTextMessage') && msg.message.extendedTextMessage.text.startsWith('') ? msg.message.extendedTextMessage.text : (type == 'buttonsResponseMessage' && msg.message.buttonsResponseMessage.selectedButtonId.startsWith('')) ? msg.message.buttonsResponseMessage.selectedButtonId : (type == 'templateButtonReplyMessage') && msg.message.templateButtonReplyMessage.selectedId.startsWith('') ? msg.message.templateButtonReplyMessage.selectedId.startsWith('') : ""
             const budy = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : ''	
	     const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
             const args = body.trim().split(/ +/).slice(1)
             const q = args.join(' ')
             const pushname = (msg.pushName != '' || msg.pushName != undefined) ? msg.pushName : undefined
             const isCmd = body.startsWith('')
       } catch (err) {
          console.log('unexpected error: ' + err)
      }
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
       }
    })
  client.ev.on('creds.update', () => saveState)
  return client
}

start().catch (err => console.log('unexpected error: ' + err))
