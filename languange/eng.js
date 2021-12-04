exports.registered = (namaUser, umurUser, serialUser, time, sender) => {
	return`
┌───「 *MITSUHA BOTZ* 」───
│
├ *Name*: ${namaUser}
├ *No*: wa.me/${sender.split("@")[0]}
├ *Age*: ${umurUser}
├ *Ns*: ${serialUser}
│
└──────────────────`
}

exports.noregis = () => {
	return`\`\`\`You not register, Please typing .verify\`\`\``
}

exports.wait = () => {
	return`PROCESS...`
}
