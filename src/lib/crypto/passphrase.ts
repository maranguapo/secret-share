// 5 palavras de uma lista curada = ~52 bits de entropia
// Suficiente para AES-256 com PBKDF2: o gargalo é o PBKDF2, não o tamanho
const WORDLIST = [
  'amber','bridge','castle','delta','ember','falcon','grove','harbor',
  'indigo','jungle','kettle','lantern','marble','noble','ocean','pillar',
  'quartz','river','silver','timber','umbra','violet','willow','xenon',
  'yellow','zenith','anchor','bloom','cipher','drift','eagle','frost',
  'glacier','hollow','iron','jewel','kindle','lunar','mist','north',
  'orbit','pine','quest','ridge','storm','thorn','ultra','vault',
  'wave','axiom','breeze','cobalt','dusk','echo','flint','granite',
  'haze','inlet','jade','knoll','lava','mossy','nova','opal',
  'prism','reign','slate','trek','umber','vortex','wyrm','xeric',
] as const

export function generatePassphrase(wordCount = 5): string {
  const array = new Uint32Array(wordCount)
  crypto.getRandomValues(array)

  return Array.from(array)
    .map(n => WORDLIST[n % WORDLIST.length])
    .join('-')
}