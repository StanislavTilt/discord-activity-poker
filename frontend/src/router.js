import { createRouter, createWebHistory } from 'vue-router';
import AdminPanel from './views/AdminPanel.vue';
import PokerRoom from './views/PokerRoom.vue';
import Preview from './views/Preview.vue';
import Activity from './views/Activity.vue';

const routes = [
  { path: '/admin/:gameId', component: AdminPanel, props: true },
  { path: '/room/:gameId', component: PokerRoom, props: true },
  { path: '/preview', component: Preview },
  { path: '/activity', component: Activity },
  { path: '/', component: Activity } // Default route = Activity (for Discord iframe)
];

export default createRouter({
  history: createWebHistory(),
  routes
});
