import {RoutedDashboard} from '@/components/routed-dashboard';
import {loadPlayer} from '@/lib/player';
import {loadGame} from '@/lib/game/load';
import {loadEngagement} from '@/lib/engagement/load';
type View='command-hall'|'quests'|'character'|'achievements'|'treasury'|'fellowship'|'legends'|'verification'|'profile'|'settings';
export async function GamePage({view}:{view:View}){const player=await loadPlayer();const game=await loadGame();const engagement=await loadEngagement(game.progress.map(progress=>progress.id));return <RoutedDashboard player={player} game={game} engagement={engagement} view={view}/>;}
