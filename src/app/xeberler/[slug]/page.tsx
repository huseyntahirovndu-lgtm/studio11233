import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';
import type { Metadata } from 'next';
import { News, Admin } from '@/types';
import NewsDetailsClient from './page-client';

type Props = {
  params: { slug: string };
};

// Function to fetch data on the server
async function getNewsData(slug: string) {
    const { firestore } = initializeServerFirebase();
    const newsQuery = query(collection(firestore, 'news'), where('slug', '==', slug), limit(1));
    const newsSnapshot = await getDocs(newsQuery);

    if (newsSnapshot.empty) {
        return { newsItem: null, author: null };
    }

    const newsItem = { id: newsSnapshot.docs[0].id, ...newsSnapshot.docs[0].data() } as News;
    
    let author: Admin | null = null;
    if (newsItem.authorId) {
        const authorDoc = await getDoc(doc(firestore, 'users', newsItem.authorId));
        if (authorDoc.exists()) {
            author = authorDoc.data() as Admin;
        }
    }
    
    return { newsItem, author };
}

// generateMetadata function for dynamic SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { newsItem } = await getNewsData(params.slug);

  if (!newsItem) {
    return {
      title: 'Xəbər Tapılmadı',
      description: 'Axtardığınız xəbər mövcud deyil.',
    };
  }
  
  const description = newsItem.content.replace(/<[^>]*>?/gm, '').substring(0, 160);

  return {
    title: `${newsItem.title} | İstedad Mərkəzi`,
    description: description,
    openGraph: {
      title: newsItem.title,
      description: description,
      type: 'article',
      images: [
        {
          url: newsItem.coverImageUrl || 'https://istedadmerkezi.net/logo.png',
          width: 1200,
          height: 630,
          alt: newsItem.title,
        },
      ],
    },
    twitter: {
       card: 'summary_large_image',
       title: newsItem.title,
       description: description,
       images: [newsItem.coverImageUrl || 'https://istedadmerkezi.net/logo.png'],
    }
  };
}

// The main page component is now a Server Component
export default async function NewsDetailsPage({ params }: Props) {
  const { newsItem, author } = await getNewsData(params.slug);

  if (!newsItem) {
    return <div className="text-center py-20">Xəbər tapılmadı.</div>;
  }
  
  // Pass server-fetched data to the client component
  return <NewsDetailsClient newsItem={newsItem} author={author} />;
}
