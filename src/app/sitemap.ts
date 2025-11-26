import { getDocs, collection } from 'firebase/firestore';
import { initializeServerFirebase } from '@/firebase/server-init';
import { Student } from '@/types';

const BASE_URL = 'https://istedadmerkezi.net';

export default async function sitemap() {
  const { firestore } = initializeServerFirebase();

  // Static pages
  const routes = ['', '/search', '/rankings'].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
  }));

  let studentUrls: any[] = [];
  try {
    const studentsSnapshot = await getDocs(collection(firestore, 'users'));
    studentUrls = studentsSnapshot.docs
      .map(doc => doc.data() as Student)
      .filter(user => user.role === 'student' && user.status === 'təsdiqlənmiş')
      .map((student) => ({
        url: `${BASE_URL}/profile/${student.id}`,
        lastModified: new Date().toISOString(), 
    }));
  } catch (e) {
    console.error("Could not fetch students for sitemap", e);
  }


  return [...routes, ...studentUrls];
}
