// Garante leitura em runtime, não em build time
export function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variável de ambiente ausente: ${key}`)
  return value
}