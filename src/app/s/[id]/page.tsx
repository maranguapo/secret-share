import { readSecret } from '@/lib/actions'
import SecretViewer from '@/components/secret/SecretViewer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SecretPage({ params }: Props) {
  const { id } = await params

  try {
    const secret = await readSecret(id)
    return <SecretViewer secret={secret} />
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    return (
      <div className="text-center mt-20 text-gray-500">
        {msg === 'not_found_or_expired'
          ? 'Este segredo não existe ou já expirou.'
          : 'Erro ao carregar o segredo.'}
      </div>
    )
  }
}