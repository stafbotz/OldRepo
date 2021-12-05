const { WAConnection, MessageType, Presence, Mimetype, GroupSettingChange } = require('@adiwajshing/baileys')
const { downloadContentFromMessage } = require('@adiwajshing/baileys-md')
const { color, bgcolor } = require('../lib/color')
const { getBuffer, h2k, generateMessageID, getGroupAdmins, getRandom } = require('../lib/functions')
const { fetchJson, fetchText } = require('../lib/fetcher')
const { recognize } = require('../lib/ocr')
const fs = require('fs-extra')
const moment = require('moment-timezone')
const { exec } = require('child_process')
const fetch = require('node-fetch')
const ffmpeg = require('fluent-ffmpeg')
const { removeBackgroundFromImageFile } = require('remove.bg')
const lolis = require('lolis.life')
const loli = new lolis()
const setting = JSON.parse(fs.readFileSync('../database/settings.json'))

function kyun(seconds){
  function pad(s){
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(seconds / (60*60));
  var minutes = Math.floor(seconds % (60*60) / 60);
  var seconds = Math.floor(seconds % 60);

  //return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds)
  return `${pad(hours)} Jam ${pad(minutes)} Menit ${pad(seconds)} Detik`
}

module.exports = async(client, mek) => {
  try {
        if (!mek.hasNewMessage) return
        mek = mek.messages.all()[0]
	    if (!mek.message) return
		if (mek.key && mek.key.remoteJid == 'status@broadcast') return
		if (mek.key.fromMe) return
		global.blocked
		const content = JSON.stringify(mek.message)
		const from = mek.key.remoteJid
		const type = Object.keys(mek.message)[0]
		const { text, extendedText, contact, location, liveLocation, image, video, sticker, document, audio, product } = MessageType
		const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
		body = (type === 'conversation' && mek.message.conversation.startsWith('')) ? mek.message.conversation : (type == 'imageMessage') && mek.message.imageMessage.caption.startsWith('') ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption.startsWith('') ? mek.message.videoMessage.caption : (type == 'extendedTextMessage') && mek.message.extendedTextMessage.text.startsWith('') ? mek.message.extendedTextMessage.text : ''
		budy = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : ''
		const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
		const args = body.trim().split(/ +/).slice(1)
		const isCmd = body.startsWith('')
		const botNumber = client.user.jid
		const ownerNumber = ['6283170659182@s.whatsapp.net']
		const isGroup = from.endsWith('@g.us')
		const sender = isGroup ? mek.participant : mek.key.remoteJid
		const groupMetadata = isGroup ? await client.groupMetadata(from) : ''
		const groupName = isGroup ? groupMetadata.subject : ''
		const groupId = isGroup ? groupMetadata.jid : ''
		const groupMembers = isGroup ? groupMetadata.participants : ''
		const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : ''
		const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
		const isGroupAdmins = groupAdmins.includes(sender) || false
		const isOwner = ownerNumber.includes(sender)
		const isUrl = (url) => {
		    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
		}
		const reply = (teks) => {
			client.sendMessage(from, teks, text, {quoted:mek})
		}
		const mentions = (teks, memberr, id) => {
			(id == null || id == undefined || id == false) ? client.sendMessage(from, teks.trim(), extendedText, {contextInfo: {"mentionedJid": memberr}}) : client.sendMessage(from, teks.trim(), extendedText, {quoted: mek, contextInfo: {"mentionedJid": memberr}})
		}
		colors = ['red','white','black','blue','yellow','green']
		const isMedia = (type === 'imageMessage' || type === 'videoMessage')
		const isQuotedImage = type === 'extendedTextMessage' && content.includes('imageMessage')
		const isQuotedVideo = type === 'extendedTextMessage' && content.includes('videoMessage')
		const isQuotedSticker = type === 'extendedTextMessage' && content.includes('stickerMessage')
		if (!isGroup && isCmd) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mEXEC\x1b[1;37m]', time, color(command), 'from', color(sender.split('@')[0]), 'args :', color(args.length))
		if (!isGroup && !isCmd) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;31mRECV\x1b[1;37m]', time, color('Message'), 'from', color(sender.split('@')[0]), 'args :', color(args.length))
		if (isCmd && isGroup) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;32mEXEC\x1b[1;37m]', time, color(command), 'from', color(sender.split('@')[0]), 'in', color(groupName), 'args :', color(args.length))
		if (!isCmd && isGroup) console.log('\x1b[1;31m~\x1b[1;37m>', '[\x1b[1;31mRECV\x1b[1;37m]', time, color('Message'), 'from', color(sender.split('@')[0]), 'in', color(groupName), 'args :', color(args.length))
		let authorname = client.contacts[from] != undefined ? client.contacts[from].vname || client.contacts[from].notify : undefined	
		if (authorname != undefined) { } else { authorname = groupName }	
			
		function addMetadata(packname, author) {	
			if (!packname) packname = 'WABot'; if (!author) author = 'Bot';	
			author = author.replace(/[^a-zA-Z0-9]/g, '');	
			let name = `${author}_${packname}`
		    if (fs.existsSync(`../database/exifsticker/${name}.exif`)) return `../database/exifsticker/${name}.exif`
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

			fs.writeFile(`../database/exifsticker/${name}.exif`, buffer, (err) => {	
				return `../database/exifsticker/${name}.exif`	
			})	

		}
		switch(command) {
			default:
				
           }
        } catch (e) {
       console.log('Error : %s', color(e, 'red'))
   }
}
