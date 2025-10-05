import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'kanban',
    component: () => import('../views/KanbanView.vue'),
  },
  {
    path: '/job/:id',
    name: 'job-detail',
    component: () => import('../views/JobDetailView.vue'),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
