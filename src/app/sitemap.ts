import { getDocs, collection, query, where } from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';
import { Student, StudentOrganization, Project, News } from '@/types';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://istedadmerkezi.net';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { firestore } = initializeServerFirebase();

  // Static pages
  const routes = ['', '/search', '/rankings', '/xeberler', '/telebe-teskilatlari'].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
  }));

  // Helper function to fetch documents and map to URLs
  const fetchUrls = async (collectionName: string, path: (doc: any) => string, filterField?: string, filterValue?: any) => {
    try {
      let q = query(collection(firestore, collectionName));
      if (filterField && filterValue) {
        q = query(q, where(filterField, '==', filterValue));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        url: `${BASE_URL}${path(doc.data())}`,
        lastModified: new Date().toISOString(),
      }));
    } catch (e) {
      console.error(`Could not fetch ${collectionName} for sitemap`, e);
      return [];
    }
  };

  // Fetch all dynamic URLs in parallel
  const [
    studentUrls,
    orgUrls,
    projectUrls,
    newsUrls
  ] = await Promise.all([
    fetchUrls('users', (doc: Student) => `/profile/${doc.id}`, 'role', 'student'),
    fetchUrls('student-organizations', (doc: StudentOrganization) => `/telebe-teskilatlari/${doc.id}`),
    fetchUrls('projects', (doc: Project) => `/projects/${doc.id}`),
    fetchUrls('news', (doc: News) => `/xeberler/${doc.slug}`),
  ]);

  return [...routes, ...studentUrls, ...orgUrls, ...projectUrls, ...newsUrls];
}
