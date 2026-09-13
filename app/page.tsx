import {GamePage} from '@/components/game-page';
export const dynamic = 'force-dynamic';
export default async function Home() {
 return <GamePage view="command-hall"/>;
}

