import SecretViewer from '@/components/secret/SecretViewer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SecretPage({ params }: Props) {
  const { id } = await params
  return <SecretViewer id={id} />
}
