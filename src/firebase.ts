import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const app = initializeApp({
  apiKey: 'AIzaSyBlNMf2g-_QdGhmAm0IPWN_GMVHYLYWrWM',
  authDomain: 'ieltsplatform-ee25e.firebaseapp.com',
  projectId: 'ieltsplatform-ee25e',
  storageBucket: 'ieltsplatform-ee25e.firebasestorage.app',
  messagingSenderId: '92624579719',
  appId: '1:92624579719:web:43cb27026f9e53f30a5c22',
  measurementId: 'G-E70C6FE5YS',
});
export const auth = getAuth(app);
export const db = getFirestore(app);
export function errorMessage(error: unknown): string {
  const code = (error as {code?: string})?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email немесе құпиясөз дұрыс емес.',
    'auth/email-already-in-use': 'Бұл email тіркелген. Аккаунтыңызға кіріңіз.',
    'auth/weak-password': 'Құпиясөз кемінде 8 таңбадан тұруы керек.',
    'auth/invalid-email': 'Email мекенжайын дұрыс енгізіңіз.',
    'auth/popup-closed-by-user': 'Google арқылы кіру аяқталмады. Қайта көріңіз.',
    'auth/popup-blocked': 'Браузер кіру терезесін бұғаттады. Қалқымалы терезелерге рұқсат беріңіз.',
    'auth/unauthorized-domain': 'Бұл домен Firebase Authentication тізіміне қосылмаған. Сайт әкімшісіне хабарласыңыз.',
    'auth/operation-not-allowed': 'Бұл кіру тәсілі әлі қосылмаған. Сайт әкімшісіне хабарласысыңыз.',
    'auth/network-request-failed': 'Интернет байланысын тексеріп, қайта көріңіз.',
    'auth/too-many-requests': 'Тым көп әрекет жасалды. Біраздан кейін қайта көріңіз.',
    'permission-denied': 'Деректерге қолжетімділік жоқ. Аккаунт рұқсатын немесе Firebase ережелерін тексеріңіз.',
    'unavailable': 'Сервермен байланыс үзілді. Мәтініңізді сақтап, қайта көріңіз.',
  };
  return messages[code || ''] || 'Әрекет орындалмады. Қайта көріңіз немесе әкімшіге хабарласыңыз.';
}
