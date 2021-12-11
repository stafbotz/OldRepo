// Module
const { 
       default: makeWASocket, 
       BufferJSON, 
       initInMemoryKeyStore, 
       DisconnectReason, 
       AnyMessageContent, 
       delay, 
       proto, 
       downloadHistory, 
       getMessage, 
       generateWAMessageContent, 
       prepareWAMessageMedia,
       useSingleFileAuthState, 
       generateWAMessageFromContent,
       downloadContentFromMessage,
       WA_DEFAULT_EPHEMERAL
} = require('@adiwajshing/baileys-md')
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
const settings = JSON.parse(fs.readFileSync('./database/settings.json'))

// Custom
const ownerNumber = settings.ownerNumber + '@s.whatsapp.net'
const ownerName = settings.ownerName
const prefix = settings.prefix
const limitCount = settings.limitCount

async function start() {
    const client = makeWASocket({ 
       printQRInTerminal: true, 
       logger: pino({ level: 'silent' }),
       auth: state
    })
    client.ev.on('messages.upsert', async (mek) => {
       try {
             const msg = mek.messages[0]
             if (!msg.message) return
             const content = JSON.stringify(msg.message)
             const type = Object.keys(msg.message)[0]
             const body = (type === 'conversation' && msg.message.conversation.startsWith(prefix)) ? msg.message.conversation : (type == 'imageMessage') && msg.message.imageMessage.caption.startsWith(prefix) ? msg.message.imageMessage.caption : (type == 'documentMessage') && msg.message.documentMessage.caption.startsWith(prefix) ? msg.message.documentMessage.caption : (type == 'videoMessage') && msg.message.videoMessage.caption.startsWith(prefix) ? msg.message.videoMessage.caption : (type == 'extendedTextMessage') && msg.message.extendedTextMessage.text.startsWith(prefix) ? msg.message.extendedTextMessage.text : (type == 'buttonsResponseMessage' && msg.message.buttonsResponseMessage.selectedButtonId.startsWith(prefix)) ? msg.message.buttonsResponseMessage.selectedButtonId : (type == 'templateButtonReplyMessage') && msg.message.templateButtonReplyMessage.selectedId.startsWith(prefix) ? msg.message.templateButtonReplyMessage.selectedId : ''
             const budy = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : ''	
	     const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
             const args = body.trim().split(/ +/).slice(1)
             const q = args.join(' ')
             const pushname = msg.pushName
             const isCmd = body.startsWith(prefix)
             const fromMe = msg.key.fromMe
	     const from = msg.key.remoteJid        
             const isGroup = msg.key.remoteJid.endsWith('@g.us')
             const sender = isGroup ? (msg.key.participant ? msg.key.participant : msg.participant) : msg.key.remoteJid
             const time = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('DD/MM/YY HH:mm:ss')
             const botNumber = client.user.id.split(':')[0] + '@s.whatsapp.net'
             const groupMetadata = isGroup ? await client.groupMetadata(from) : ''
	     const groupName = isGroup ? groupMetadata.subject : ''
	     const groupId = isGroup ? groupMetadata.id : ''
             const groupMembers = isGroup ? groupMetadata.participants : ''
             const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : ''
	     const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
	     const isGroupAdmins = groupAdmins.includes(sender) || false
             const isOwner = ownerNumber.includes(sender)
             const date = new Date()
            
             const listdays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
             const listmonth = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
             const tanggal = `${date.getDate()} ${listmonth[date.getMonth()]} ${date.getFullYear()}`
             const hari = `${listdays[date.getDay()]}`

             const isUrl = (url) => {
	         return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/, 'gi'))
	     }
             const jsonformat = (json) => {
                 return JSON.stringify(json, null, 2)
             }
             
             const isImage = (type == 'imageMessage')
             const isVideo = (type == 'videoMessage')
             const isSticker = (type == 'stickerMessage')
             const isQuotedMsg = (type == 'extendedTextMessage')
             const isQuotedImage = isQuotedMsg ? content.includes('imageMessage') ? true : false : false
             const isQuotedAudio = isQuotedMsg ? content.includes('audioMessage') ? true : false : false
             const isQuotedDocument = isQuotedMsg ? content.includes('documentMessage') ? true : false : false
             const isQuotedVideo = isQuotedMsg ? content.includes('videoMessage') ? true : false : false
             const isQuotedSticker = isQuotedMsg ? content.includes('stickerMessage') ? true : false : false
             
             const reply = (text, mentions) => {
                 return client.sendMessage(from, { text: text, mentions: mentions ? mentions : [] }, { quoted: msg })
             }
             const sendContact = (jid, numbers, name, quoted, mentions) => {
                 let number = numbers.replace(/[^0-9]/g, '')
                 const vcard = 'BEGIN:VCARD\n' 
                             + 'VERSION:3.0\n' 
                             + 'FN:' + name + '\n'
                             + 'ORG:;\n'
                             + 'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n'
                             + 'END:VCARD'
             return client.sendMessage(from, { contacts: { displayName: name, contacts: [{ vcard }] }, mentions : mentions ? mentions : []}, { quoted: quoted })
             }
             const sendFileFromUrl = async (from, url, caption, quoted, mentions) => {
                 let mime = ''
                 let res = await axios.head(url)
                 mime = res.headers['content-type']
                 if (mime.split('/')[1] === 'gif') {
                   return client.sendMessage(from, { video: await getBuffer(url), caption: caption, gifPlayback: true, mentions: mentions ? mentions : []}, {quoted: quoted})
                 }
                 let type = mime.split('/')[0] + 'Message'
                 if (mime.split('/')[0] === 'image') {
                   return client.sendMessage(from, { image: await getBuffer(url), caption: caption, mentions: mentions ? mentions : []}, {quoted: quoted})
                 } else if(mime.split('/')[0] === 'video') {
                   return client.sendMessage(from, { video: await getBuffer(url), caption: caption, mentions: mentions ? mentions : []}, {quoted: msg})
                 } else if(mime.split('/')[0] === 'audio') {
                    return client.sendMessage(from, { audio: await getBuffer(url), caption: caption, mentions: mentions ? mentions : [], mimetype: 'audio/mpeg'}, {quoted: quoted})
                 } else {
                    return client.sendMessage(from, { document: await getBuffer(url), mimetype: mime, caption: caption, mentions: mentions ? mentions : []}, {quoted: quoted})
                }
             }
             const buttonsDefault = [
                 { callButton: { displayText: 'Call Owner', phoneNumber: '+6283170659182'} },
                 { urlButton: { displayText: 'Script Bot', url : 'https://github.com/stafbotz/BotWhatsapp'} },
                 { quickReplyButton: { displayText: 'Owner', id: '' } },
                 { quickReplyButton: { displayText: 'Rules', id: '' } }
             ]

             const textTemplateButtons = (from, text, footer, buttons) => {
                 return client.sendMessage(from, { text: text, footer: footer, templateButtons: buttons })
             }
         
             client.sendReadReceipt(from, sender, [msg.key.id])
            
             const hour_now = moment().format('HH:mm:ss')
             if (!isGroup && isCmd && !fromMe) console.log(`{\n`, color(` from: "${sender.split('@')[0]}"\n  time: "${hour_now}"\n  args: "${args.length}"`,'yellow'), color(`\n}`,`white`))
             if (!isGroup && !isCmd && !fromMe) console.log(`{\n`, color(` from: "${sender.split('@')[0]}"\n  time: "${hour_now}"\n  args: "${args.length}"`,'yellow'), color(`\n}`,`white`))
	     if (isCmd && isGroup && !fromMe) console.log(`{\n`, color(` from: "${sender.split('@')[0]} - ${groupName}"\n  time: "${hour_now}"\n  args: "${args.length}"`,'yellow'), color(`\n}`,`white`))
	     if (!isCmd && isGroup && !fromMe) console.log(`{\n`, color(` from: "${sender.split('@')[0]} - ${groupName}"\n  time: "${hour_now}"\n  args: "${args.length}"`,'yellow'), color(`\n}`,`white`))
	     
             switch (command) {
                 case 'menu' :
                     anu = `- *INFO ACCOUNT*\n⦿ Name : ${pushname}\n⦿ Status : ${isOwner ? 'Owner' : 'Free'}\n⦿ Limit : 30\n\n- *WAKTU INDONESIA*\n⦿ Jam : ${hour_now}\n⦿ Hari : ${hari}\n⦿ Tanggal : ${tanggal}\n\n- *LIST FEATURE*\n▢ !kick\n▢ !add\n▢ !promote\n▢ !demote\n▢ !tagall\n▢ !linkgroup\n▢ !revoke\n▢ !hidetag`
                     var message = await prepareWAMessageMedia({ image: fs.readFileSync('./src/media/tree.jpg') }, { upload: client.waUploadToServer })
                     var template = generateWAMessageFromContent(from, proto.Message.fromObject({
                     templateMessage: {
                         hydratedTemplate: {
                             imageMessage: message.imageMessage,
                             hydratedContentText: anu,
                             hydratedButtons: [{
                                 urlButton: {
                                     displayText: 'Source Code',
                                     url: 'https://github.com/stafbotz/BotWhatsapp'
                                 }
                             }, {
                                 callButton: {
                                     displayText: 'Phone Owner',
                                     phoneNumber: '+62 831-7065-9182'
                                 }
                             }, {
                                 quickReplyButton: {
                                     displayText: 'Ayonima',
                                     id: ''
                                 }
                              }]
                           }
                        }
                     }), { userJid: from, quoted: msg })
                     client.relayMessage(from, template.message, { messageId: template.key.id })
                 break
                 case 'kick' :
                     if (!isGroup) return reply('Hanya grup!')
                     if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                     if (!isGroupAdmins) return reply('Hanya Admin!')
                     var users = msg.message.extendedTextMessage.contextInfo.mentionedJid[0] || msg.message.extendedTextMessage.contextInfo.participant
		     await client.groupParticipantsUpdate(from, [users], 'remove').then((res) => reply(jsonformat(res))).catch((err) => reply(jsonformat(err)))
                 break
                 case 'add' :
                     if (!isGroup) return reply('Hanya grup!')
                     if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                     if (!isGroupAdmins) return reply('Hanya Admin!')
                     var users = msg.message.extendedTextMessage.contextInfo.participant || q.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
		     await client.groupParticipantsUpdate(from, [users], 'add').then((res) => reply(jsonformat(res))).catch((err) => reply(jsonformat(err)))
                 break
                 case 'promote':
		      if (!isGroup) return reply('Hanya grup!')
                      if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                      if (!isGroupAdmins) return reply('Hanya Admin!')
                      var users = msg.message.extendedTextMessage.contextInfo.mentionedJid[0] || msg.message.extendedTextMessage.contextInfo.participant
		      await client.groupParticipantsUpdate(from, [users], 'promote').then((res) => reply(jsonformat(res))).catch((err) => reply(jsonformat(err)))
	         break
	         case 'demote': 
                      if (!isGroup) return reply('Hanya grup!')
                      if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                      if (!isGroupAdmins) return reply('Hanya Admin!')
                      var users = msg.message.extendedTextMessage.contextInfo.participant || q.replace(/[^0-9]/g, '')+'@s.whatsapp.net' 
		      await client.groupParticipantsUpdate(from, [users], 'demote').then((res) => reply(jsonformat(res))).catch((err) => reply(jsonformat(err)))
	         break
                 case 'linkgroup':
                      if (!isGroup) return reply('Hanya grup!')
                      if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                      var response = await client.groupInviteCode(from)
                      client.sendMessage(from, { text: `https://chat.whatsapp.com/${response}\n\nLink Group : ${groupMetadata.subject}`, detectLink: true }, { quoted: msg })
                 break
                 case 'revoke':
                      if (!isGroup) return reply('Hanya grup!')
                      if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                      if (!isGroupAdmins) return reply('Hanya Admin!')
                      var response = await client.groupRevokeInvite(from)
                      client.sendMessage(from, { text: `*New Link for ${groupName}* :\n https://chat.whatsapp.com/${response}`, detectLink: true }, { quoted: msg })
                 break
                 case 'tagall':
                       if (!isGroup) return reply('Hanya grup!')
                       if (!isGroupAdmins) return reply('Hanya Admin!')
                       var response = `*👥 Mention All*\n\n➲ *Message : ${q ? q : 'Nothing'}*\n\n`
		       for (let mem of groupMembers) {
		         response += `• @${mem.id.split('@')[0]}\n`
		       }
                       client.sendMessage(from, { text: response, mentions: groupMembers.map(a => a.id) }, { quoted: msg })
                 break
                 case 'hidetag':
                       if (!isGroup) return reply('Hanya grup!')
                       if (!isGroupAdmins) return reply('Hanya Admin!')
                       client.sendMessage(from, { text : q ? q : '' , mentions: groupMembers.map(a => a.id)})
                 break
                 case 'getquoted':
                      reply(JSON.stringify(msg.message.extendedTextMessage.contextInfo, null, 3))
                 break
                 default:
             }	
       } catch (err) {
          console.log('Error : %s', color(err, 'red'))
      }
    })
    client.ev.on('group-participants.update', async (anu) => {
        console.log(anu)
        try {
            let metadata = await client.groupMetadata(anu.id)
            let participants = anu.participants
            for (let num of participants) {
                try {
                    ppuser = await client.profilePictureUrl(num, 'image')
                } catch {
                    ppuser = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }

                try {
                    ppgroup = await client.profilePictureUrl(anu.id, 'image')
                } catch {
                    ppgroup = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg'
                }

                if (anu.action == 'add') {
                    client.sendMessage(anu.id, { image: { url: ppuser }, contextInfo: { mentionedJid: [num] }, caption: `Halo @${num.split("@")[0]}\nSelamat datang di grup *${metadata.subject}*` })
                } else if (anu.action == 'remove') {
                    client.sendMessage(anu.id, { image: { url: ppuser }, contextInfo: { mentionedJid: [num] }, caption: `Sayonara @${num.split("@")[0]}👋` })
                }
            }
        } catch (err) {
            console.log('Error : %s', color(err, 'red'))
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
    })
  client.ev.on('creds.update', () => saveState)
  return client
}

start()
.catch (err => clientLog('err', err))
