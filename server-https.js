const { createServer } = require('https')
const { createServer: createHttpServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const dev  = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const app  = next({ dev })
const handle = app.getRequestHandler()

// Gera certificado autoassinado se não existir
function getCerts() {
  const certDir  = '/app/certs'
  const certFile = path.join(certDir, 'cert.pem')
  const keyFile  = path.join(certDir, 'key.pem')

  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true })

  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.log('→ Gerando certificado autoassinado...')
    execSync(`
      openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout ${keyFile} \
        -out ${certFile} \
        -days 3650 \
        -subj "/CN=secretshare" \
        -addext "subjectAltName=IP:192.168.1.12,IP:127.0.0.1,DNS:localhost"
    `)
    console.log('✓ Certificado gerado')
  }

  return {
    key:  fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  }
}

app.prepare().then(() => {
  const certs = getCerts()

  createServer(certs, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, '0.0.0.0', () => {
    console.log(`▲ Next.js rodando em https://0.0.0.0:${port}`)
  })
})