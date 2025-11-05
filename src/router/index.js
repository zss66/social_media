import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: "容器管理",
      requiresAuth: false,
    },
  },
  {
    path: "/knowledge",
    name: "Knowledge",
    component: () => import("../views/Knowledge.vue"),
    meta: {
      title: "知识库管理",
      requiresAuth: false,
    },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
    meta: {
      title: "设置",
      requiresAuth: false,
    },
  },
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
    meta: {
      title: "关于",
      requiresAuth: false,
    },
  },
  {
    path: "/container/:id",
    name: "Container",
    component: () => import("../views/Container.vue"),
    meta: {
      title: "容器",
      requiresAuth: false,
    },
  },
  // 404 页面
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFound.vue"),
    meta: {
      title: "页面未找到",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - Multi Social Platform`;
  }

  // 权限检查（如果需要的话）
  if (to.meta.requiresAuth) {
    // 检查用户是否已登录
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      next("/login");
      return;
    }
  }

  next();
});

router.afterEach((to, from) => {
  // 路由切换后的操作
  console.log(`Navigation from ${from.path} to ${to.path}`);
});

export default router;
