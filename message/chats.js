const { downloadContentFromMessage } = require('@adiwajshing/baileys-md')
const { h2k, getBuffer, randomBytes, generateMessageID, getGroupAdmins, getRandom } = require('./lib/function')
const fs = require('fs-extra')
const moment = require('moment-timezone')
const { exec, spawn } = require("child_process")
const axios = require('axios')
const { color, bgcolor } = require('./lib/color')

moment.tz.setDefault('Asia/Jakarta').locale('id')
