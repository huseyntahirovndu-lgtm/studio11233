import { Metadata } from 'next'
import AddNewsPageClient from './add-news-client'

export const metadata: Metadata = {
  title: 'Xəbər əlavə et',
  description: 'Admin panelində yeni xəbər əlavə edin',
}

export default function AddNewsPage() {
  return <AddNewsPageClient />
}