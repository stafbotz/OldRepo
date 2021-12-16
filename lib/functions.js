const fetch = require('node-fetch')
const axios = require('axios')
const cfonts = require('cfonts')
const spin = require('spinnies')
const crypto = require('crypto')
const fs = require('fs-extra')
const { color, bgcolor } = require('./color')

const h2k = (number) => {
    var SI_POSTFIXES = ["", " K", " M", " G", " T", " P", " E"]
    var tier = Math.log10(Math.abs(number)) / 3 | 0
    if(tier == 0) return number
    var postfix = SI_POSTFIXES[tier]
    var scale = Math.pow(10, tier * 3)
    var scaled = number / scale
    var formatted = scaled.toFixed(1) + ''
    if (/\.0$/.test(formatted))
      formatted = formatted.substr(0, formatted.length - 2)
    return formatted + postfix
}

const getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (e) {
		console.log(`Error : ${e}`)
	}
}

const randomBytes = (length) => {
    return crypto.randomBytes(length)
}

const generateMessageID = () => {
    return randomBytes(10).toString('hex').toUpperCase()
}

const getGroupAdmins = (participants) => {
     let admins = []
	for (let i of participants) {
		i.admin !== null ? admins.push(i.id) : ''
	}
	return admins
}

const getRandom = (ext) => {
     return `${Math.floor(Math.random() * 10000)}${ext}`
}

const clientLog = (type, value) => {
if ( !type || !value ) return
     if (type === 'err')  {
       console.log('client', color('ERR!', 'red'), value)
     }
     if (type === 'warn') {
       console.log('client', color('WARN!', 'yellow'), value)  
     }
     if (type === 'info') {
       console.log('client', color('INFO!', 'green'), value)  
     }
}

module.exports = { h2k, getBuffer, randomBytes, generateMessageID, getGroupAdmins, getRandom, clientLog }
