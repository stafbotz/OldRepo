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
const { h2k, getBuffer, randomBytes, generateMessageID, getGroupAdmins, getRandom, clientLog, uploadFileUgu } = require('./lib/functions')
const fs = require('fs-extra')
const axios = require('axios')
const moment = require('moment-timezone')
const util = require('util')
const ffmpeg = require('fluent-ffmpeg')
const FileType = require('file-type')
const { exec, spawn, execSync } = require('child_process')
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

// Start
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
             const isAntiLink = isGroup ? antilink.includes(from) : false
            
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
             const isMedia = type.includes('videoMessage') || type.includes('imageMessage') || type.includes('stickerMessage') || type.includes('audioMessage') || type.includes('documentMessage')
                 
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
            
             function addMetadata(packname, author) {	
	           if (!packname) packname = 'WABot'; if (!author) author = 'Bot';	
		   author = author.replace(/[^a-zA-Z0-9]/g, '');	
		   let name = `${author}_${packname}`
		   if (fs.existsSync(`./src/stickers/${name}.exif`)) return `./src/stickers/${name}.exif`
		   const json = {	
			 "sticker-pack-name": packname,
			 "sticker-pack-publisher": author,
		   }
		   const littleEndian = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00])	
	           const bytes = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00]	

                   let len = JSON.stringify(json).length	
		   let last	

		   if (len > 256) {	
			len = len - 256	
			bytes.unshift(0x01)	
		   } else {	
			bytes.unshift(0x00)	
	           }	

		   if (len < 16) {	
			last = len.toString(16)	
			last = "0" + len	
		   } else {	
			last = len.toString(16)	
		   }	

		    const buf2 = Buffer.from(last, "hex")	
		    const buf3 = Buffer.from(bytes)	
		    const buf4 = Buffer.from(JSON.stringify(json))	

		    const buffer = Buffer.concat([littleEndian, buf2, buf3, buf4])	

		    fs.writeFile(`./src/stickers/${name}.exif`, buffer, (err) => {	
			return `./src/stickers/${name}.exif`	
	            })	
	      }
	    
             if (isGroup && isAntiLink && !isGroupAdmins && isBotGroupAdmins){
                if (budy.match(/(https:\/\/chat.whatsapp.com)/gi)) {
                  await client.groupParticipantsUpdate(from, [sender], 'remove')
                  reply(`Removing: @${sender.split('@')[0]} from group ${groupName}. Reason: send another group link`, [sender])
                }
              }
             switch (command) {
                 case 'menu' :
                     anu = `- *INFO ACCOUNT*\n\n⦿ Name : ${pushname}\n⦿ Status : ${isOwner ? 'Owner' : 'Free'}\n⦿ Limit : 30\n\n\n- *WAKTU INDONESIA*\n\n⦿ Jam : ${hour_now}\n⦿ Hari : ${hari}\n⦿ Tanggal : ${tanggal}\n\n\n- *LIST FEATURE*\n\n⦿ Group Menu\n▢ !kick\n▢ !add\n▢ !promote\n▢ !demote\n▢ !tagall\n▢ !linkgroup\n▢ !revoke\n▢ !hidetag\n▢ !antilink\n\n⦿ Convert Menu\n▢ !stiker\n▢ !toimg\n▢ !tourl\n\n⦿ Main Menu\n▢ !join`
                     var message = await prepareWAMessageMedia({ image: fs.readFileSync('./src/media/tree.jpg') }, { upload: client.waUploadToServer })
                     var template = generateWAMessageFromContent(from, proto.Message.fromObject({
                     templateMessage: {
                         hydratedTemplate: {
                             imageMessage: message.imageMessage,
                             hydratedContentText: anu,
                             hydratedButtons: [{
                                 urlButton: {
                                     displayText: 'Source Code',
                                     url: 'https://github.com/rashidsiregar28/chikabot'
                                 }
                             }, {
                                 callButton: {
                                     displayText: 'Phone Owner',
                                     phoneNumber: '+62 831-7065-9182'
                                 }
                             }/*, {
                                 quickReplyButton: {
                                     displayText: 'Information',
                                     id: ''
                                 }
                              }*/]
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
		     await client.groupParticipantsUpdate(from, [users], 'remove')
                     reply(`Removing: @${sender.split('@')[0]} from group ${groupName}. Reason: removed by admin`, [sender])
                 break
                 case 'add' :
                     if (!isGroup) return reply('Hanya grup!')
                     if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                     if (!isGroupAdmins) return reply('Hanya Admin!')
                     var users = q ? q.replace(/[^0-9]/g, '')+'@s.whatsapp.net' : msg.message.extendedTextMessage.contextInfo.participant
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
                 case 'antilink':
                     if (!isGroup) return reply('Hanya grup!')
                     if (!isBotGroupAdmins) return reply('Bot bukan Admin!')
                     if (!isGroupAdmins) return reply('Hanya Admin!')
                     if (!q) return reply('Masukkan parameter. Contoh *!antilink enable* untuk mengaktifkan dan *!antilink disable* untuk mematikan')
                     if (q === 'enable') {
                       if (isAntiLink) return reply('Antilink sudah aktif!')
                       antilink.push(from)
                       fs.writeFileSync('./database/antilink.json', JSON.stringify(antilink))
                       reply('Fitur AntiLink Diaktifkan!')
                     } else if (q === 'disable') {
                       if (!isAntiLink) return reply('Antilink sudah mati!')
                       var target = antilink.indexOf(from)
                       antilink.splice(target, 1)
                       fs.writeFileSync('./database/antilink.json', JSON.stringify(antilink))
                       reply('Fitur AntiLink Dimatikan!')
                     }
                 break
                 case 'stiker':
                        reply('Memproses!')
                        if (isMedia && msg.message.imageMessage || isQuotedImage) {
                        var encmedia = await downloadContentFromMessage((isQuotedImage ? msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : msg.message.imageMessage), 'image')
                        var media = Buffer.from([])
                        for await(chunk of encmedia) {
                           media = Buffer.concat([media, chunk])
                        }
                        var tipe = await FileType.fromBuffer(media)
                        trueFileName = ('toimg' + sender.split('@')[0] + '.' + tipe.ext)
                        await fs.writeFileSync(trueFileName, media)
                        ran = getRandom('.webp')
                        await ffmpeg(`./${trueFileName}`)
                        .input(trueFileName)
                        .on('start', function (cmd) {
                            console.log(`Started : ${cmd}`)
                         })
                        .on('error', function (err) {
                            console.log(`Error : ${err}`)
                            fs.unlinkSync(trueFileName)
                            reply('Gagal membuat stiker!')
                         })
                        .on('end', function () {
                            console.log('Finish')
                            exec(`webpmux -set exif ${addMetadata(`STAF`,`BOTZ`)} ${ran} -o ${ran}`, async (error) => {
                            client.sendMessage(from, { sticker: { url: ran } }, { quoted: msg })
                            fs.unlinkSync(trueFileName)	
                            fs.unlinkSync(ran)	
                         })
                         })
                        .addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
                        .toFormat('webp')
                        .save(ran)
                      } else if (isMedia && msg.message.VideoMessage.seconds < 11 || isQuotedVideo && msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage.seconds < 11) {
                        var encmedia = await downloadContentFromMessage((isQuotedVideo ? msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : msg.message.videoMessage), 'video')
                        var media = Buffer.from([])
                         for await(chunk of encmedia) {
                           media = Buffer.concat([media, chunk])
                        }
                        var tipe = await FileType.fromBuffer(media)
                        trueFileName = ('toimg' + sender.split('@')[0] + '.' + tipe.ext)
                        await fs.writeFileSync(trueFileName, media)
                        ran = getRandom('.webp')
                        await ffmpeg(`./${trueFileName}`)
                       .inputFormat(trueFileName.split('.')[1])
                       .on('start', function (cmd) {
                           console.log(`Started : ${cmd}`)
                        })
                       .on('error', function (err) {
                           console.log(`Error : ${err}`)
                           fs.unlinkSync(trueFileName)
                           tipe = trueFileName.endsWith('.mp4') ? 'video' : 'gif'
                           reply('Gagal membuat stiker!')
                        })
                       .on('end', function () {
                           console.log('Finish')
                           exec(`webpmux -set exif ${addMetadata(`STAF`, `BOTZ`)} ${ran} -o ${ran}`, async (error) => {
                           client.sendMessage(from, { sticker: { url: ran } }, { quoted: msg })
                           fs.unlinkSync(trueFileName)
                           fs.unlinkSync(ran)
                        })
                        })
                       .addOutputOptions([`-vcodec`,`libwebp`,`-vf`,`scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`])
                       .toFormat('webp')
                       .save(ran)  
                      } else {
                         reply('Reply Foto atau Video!')
                      }
                 break
                 case 'toimg':
                     if (!isQuotedSticker) return reply('Reply Stiker!')
                     reply('Memproses')
                     var encmedia = await downloadContentFromMessage(msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'image')
                     var media = Buffer.from([])
                     for await(chunk of encmedia) {
                        media = Buffer.concat([media, chunk])
                     }
                     var tipe = await FileType.fromBuffer(media)
                     trueFileName = ('toimg' + sender.split('@')[0] + '.' + tipe.ext)
                     await fs.writeFileSync(trueFileName, media)

                     var ran = await getRandom('.png')
                     exec(`ffmpeg -i ${trueFileName} ${ran}`, (err) => {
                          fs.unlinkSync(trueFileName)
                          if (err) throw err
                          var response = fs.readFileSync(ran)
                          client.sendMessage(from, { image: response }, { quoted: msg })
                          fs.unlinkSync(ran)
                     })
                 break
                 case 'msg':
                      reply(content)
                 break
                 case 'getquoted' :
                      reply(JSON.stringify(msg.message.extendedTextMessage.contextInfo, null, 3))
                 break
                 case 'tourl' :
                      if (!q) return reply('Masukkan parameter contoh: *!tourl image* untuk gambar dan *!tourl file* untuk mengupload file besar')
                      if (q === 'image') {
                         if (!isMedia && !msg.message.imageMessage || !isQuotedImg) return
                         var encmedia = await downloadContentFromMessage((isMedia ? msg.message.imageMessage : msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage), 'image')
                         var media = Buffer.from([])
                         for await(chunk of encmedia) {
                            media = Buffer.concat([media, chunk])
                         }
                         var tipe = await FileType.fromBuffer(media)
                         trueFileName = ('tourl' + sender.split('@')[0] + '.' + tipe.ext)
                         await fs.writeFileSync(trueFileName, media)
                         var response = await telegraPh(trueFileName)
                         reply(util.format(response))
                      } else if (q === 'file') {
                         if (!isMedia && !msg.message.extendedTextMessage) return
                         var encmedia = await downloadContentFromMessage((type === 'extendedTextMessage' ? msg.message[content.contextInfo.quotedMessage] : msg.message[type]), (type === 'extendedTextMessage' ? msg.message[content.contextInfo.quotedMessage.mimetype] : msg.message[content.mimetype]))
                         var media = Buffer.from([])
                         for await(chunk of encmedia) {
                            media = Buffer.concat([media, chunk])
                         }
                         var tipe = await FileType.fromBuffer(media)
                         trueFileName = ('tourl' + sender.split('@')[0] + '.' + tipe.ext)
                         await fs.writeFileSync(trueFileName, media)
                         var response = await uploadFileUgu(trueFileName)
                         reply(util.format(response))
                      }
                      await fs.unlinkSync(encmedia)
                 break
                 case 'join': 
                      if (!q || !isUrl(q) || !q.includes('chat.whatsapp.com')) return reply('Masukkan url yang valid')
                      var query = q.split('https://chat.whatsapp.com/')[1]
                      var response = await client.groupAcceptInvite(query)
                      await reply(jsonformat(response))
                 break
                 default:
                 if (budy.startsWith('=>')) {
                    if (!isOwner) return reply('Hanya Owner!')
                    function Return(sul) {
                        sat = JSON.stringify(sul, null, 2)
                        bang = util.format(sat)
                        if (sat == undefined) {
                           bang = util.format(sul)
                        }
                        return reply(bang)
                    }
                    try {
                        reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
                    } catch (e) {
                        reply(String(e))
                    }
                 }
                 if (budy.startsWith('>')) {
                    if (!isOwner) return reply('Hanya Owner!')
                    try {
                         let evaled = await eval(budy.slice(2))
                         if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
                        await reply(evaled)
                     } catch (err) {
                         m = String(err)
                         await reply(m)
                     }
                 }
                 if (budy.startsWith('$')) {
                    if (!isOwner) return reply('Hanya Owner!')
                    exec(budy.slice(2), (err, stdout) => {
                        if(err) return reply(err)
                        if (stdout) return reply(stdout)
                    })
                 }
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
