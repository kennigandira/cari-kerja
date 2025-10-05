import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

/**
 * Route Parameter Validation
 *
 * Validates route parameters to prevent injection attacks and invalid data.
 */

/**
 * Validates UUID format (common for database IDs)
 */
function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates numeric ID
 */
function isValidNumericId(id: string): boolean {
  return /^\d+$/.test(id) && Number(id) > 0;
}

/**
 * Validates job ID (UUID or numeric)
 */
function isValidJobId(id: string): boolean {
  return isValidUuid(id) || isValidNumericId(id);
}

/**
 * Route Definitions
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'kanban',
    component: () => import('../components/kanban/KanbanBoard.vue'),
    meta: {
      title: 'Job Applications',
      requiresAuth: false,
    },
  },
  {
    path: '/job/:id',
    name: 'job-detail',
    component: () => import('../views/JobDetailView.vue'),
    props: true,
    meta: {
      title: 'Job Details',
      requiresAuth: false,
      validateParams: true,
    },
  },
  // Master Profile Routes
  {
    path: '/profiles',
    name: 'profiles-list',
    component: () => import('../views/ProfilesListView.vue'),
    meta: {
      title: 'Master Profiles',
      requiresAuth: false,
    },
  },
  {
    path: '/profiles/new',
    name: 'profile-create',
    component: () => import('../views/ProfileCreateView.vue'),
    meta: {
      title: 'Create Profile',
      requiresAuth: false,
    },
  },
  {
    path: '/profiles/:id',
    name: 'profile-edit',
    component: () => import('../views/ProfileEditView.vue'),
    props: true,
    meta: {
      title: 'Edit Profile',
      requiresAuth: false,
      validateParams: true,
    },
  },
  {
    // 404 catch-all route - MUST BE LAST
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/KanbanView.vue'),
    meta: {
      title: 'Page Not Found',
    },
  },
];

/**
 * Router Instance
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  // Scroll to top on navigation
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

/**
 * Global Navigation Guards
 */

/**
 * Before Each Navigation Guard
 * - Validates route parameters
 * - Checks authentication requirements
 * - Sets document title
 */
router.beforeEach((
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // Validate route parameters if required
  if (to.meta.validateParams) {
    // Validate job ID parameter
    if (to.name === 'job-detail' && to.params.id) {
      const id = Array.isArray(to.params.id) ? to.params.id[0] : to.params.id;

      if (!id || !isValidJobId(id)) {
        console.warn(`Invalid job ID format: ${id}`);
        // Redirect to home on invalid ID
        return next({ name: 'kanban', replace: true });
      }
    }
  }

  // Future: Add authentication check
  // if (to.meta.requiresAuth && !isAuthenticated()) {
  //   return next({ name: 'login', query: { redirect: to.fullPath } });
  // }

  // Set document title
  const title = to.meta.title as string;
  if (title) {
    document.title = `${title} - Cari Kerja`;
  }

  next();
});

/**
 * After Each Navigation Guard
 * - Log navigation for analytics/debugging
 */
router.afterEach((to, _from) => {
  // Only log in development
  if (import.meta.env.DEV) {
    console.log(`Navigated to ${to.path}`);
  }
});

/**
 * Error Handler
 */
router.onError((error) => {
  console.error('Router error:', error);

  // In production, you might want to send this to an error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error);
  }
});

export default router;
