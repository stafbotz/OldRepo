const { downloadContentFromMessage } = require('@adiwajshing/baileys-md')
const { h2k, getBuffer, randomBytes, generateMessageID, getGroupAdmins, getRandom, clientLog } = require('./lib/functions')
const fs = require('fs-extra')
const moment = require('moment-timezone')
const { exec, spawn } = require('child_process')
const axios = require('axios')
const { color, bgcolor } = require('./lib/color')

const antilink = JSON.parse(fs.readFileSync('../database/antilink.json'))

moment.tz.setDefault('Asia/Jakarta').locale('id')
module.exports = async(client, msg, mek) => {
    try {
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
}
