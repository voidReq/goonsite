import type { Metadata } from 'next'
import Main from './_components/Main'

export const metadata: Metadata = {
  title: '3D — voidReq',
  description: 'Immersive creative portfolio demo',
}

export default function Page() {
  return <Main />
}
