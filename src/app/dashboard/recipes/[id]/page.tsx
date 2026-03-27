import RecipeDetailClient from './RecipeDetailClient'

export async function generateStaticParams() {
  return [{ id: 'sample' }]
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RecipeDetailClient id={id} />
}
