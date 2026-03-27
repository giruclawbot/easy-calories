import RecipeDetailClient from './RecipeDetailClient'

// Static export requires at least one param — the real ID is read
// client-side via useParams() in RecipeDetailClient
export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default function Page() {
  return <RecipeDetailClient />
}
