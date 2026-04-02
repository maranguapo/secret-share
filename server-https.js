const { createServer } = require('https')
const { parse }        = require('url')
const next             = require('next')
const { execSync }     = require('child_process')
const fs               = require('fs')
const path             = require('path')
const os               = require('os')

const dev    = process.env.NODE_ENV !== 'production'
const port   = parseInt(process.env.PORT || '3000', 10)
const app    = next({ dev })
const handle = app.getRequestHandler()

function getLocalIP() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '0.0.0.0'
}

function getCerts() {
  const certDir  = '/app/certs'
  const certFile = path.join(certDir, 'cert.pem')
  const keyFile  = path.join(certDir, 'key.pem')

  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true })

  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.log('→ Gerando certificado autoassinado...')
    const ip = getLocalIP()
    execSync(`
      openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout ${keyFile} \
        -out ${certFile} \
        -days 3650 \
        -subj "/CN=secretshare" \
        -addext "subjectAltName=IP:${ip},IP:127.0.0.1,DNS:localhost"
    `)
    console.log('✓ Certificado gerado para IP:', ip)
  }

  return {
    key:  fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  }
}

app.prepare().then(() => {
  const certs = getCerts()
  const ip    = getLocalIP()

  createServer(certs, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, '0.0.0.0', () => {
    console.log(`▲ SecretShare rodando em https://${ip}:${port}`)
  })
})
