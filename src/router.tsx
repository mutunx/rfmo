import React from 'react';
import { set } from 'lodash-es';
import { useRoutes } from 'react-router-dom';

import type { RouteObject } from 'react-router-dom';

/**
 * 根据 pages 目录生成路径配置
 */
function generatePathConfig(): Record<string, any> {
  /**
   * vite glob sample
   * modules = {
   *   './dir/foo.js': () => import('./dir/foo.js'),
   *   './dir/bar.js': () => import('./dir/bar.js')
   * }
   **/
  const modules = import.meta.glob(`/src/pages/**/$*.{ts,tsx}`);

  const pathConfig = {};
  /*
  * module keys
  * /src/pages/$index.tsx
  * /src/pages/homepage/$index.tsx
  * /src/pages/login/$index.tsx
  * /src/pages/mine/$index.tsx
  * */
  Object.keys(modules).forEach((filePath) => {
    const routePath = filePath
      .replace(`/src/pages/`, '')
      .replace(/.tsx?/, '')
      .replace(/\$\[([\w-]+)]/, ':$1') // if file name is $[test].tsx => :test
      .replace(/\$([\w-]+)/, '$1')
      .split('/');
    set(pathConfig, routePath, modules[filePath]);
  });
  /**
   * pathConfig
   * {
   *  "homepage":{
   *    "index": () => import("/src/pages/homepage/$index.tsx")
   *  },
   *  "index": () => import("/src/pages/$index.tsx")
   *  "login":{
   *    "index": () => import("/src/pages/login/$index.tsx")
   *  },
   *  "mine":{
   *    "index":() => import("/src/pages/mine/$index.tsx")
   *  }
   *  }
   */
  return pathConfig;
}

/**
 * 为动态 import 包裹 lazy 和 Suspense
 */
function wrapSuspense(importer: () => Promise<{ default: React.ComponentType }>) {
  if (!importer) {
    return undefined;
  }
  // 使用 React.lazy 包裹 () => import() 语法
  const Component = React.lazy(importer);
  // 结合 Suspense，这里可以自定义 loading 组件
  return (
    <React.Suspense fallback={null}>
      <Component />
    </React.Suspense>
  );
}

/**
 * 将文件路径配置映射为 react-router 路由
 */
function mapPathConfigToRoute(cfg: Record<string, any>): RouteObject[] {
  // route 的子节点为数组
  return Object.entries(cfg).map(([routePath, child]) => {
    // () => import() 语法判断
    if (typeof child === 'function') {
      // 等于 index 则映射为当前根路由
      const isIndex = routePath === 'index';
      return {
        index: isIndex,
        path: isIndex ? undefined : routePath,
        // 转换为组件
        element: wrapSuspense(child),
      };
    }
    // 否则为目录，则查找下一层级
    const { $, ...rest } = child;
    return {
      path: routePath,
      // layout 处理
      element: wrapSuspense($),
      // 递归 children
      children: mapPathConfigToRoute(rest),
    };
  });
}

function generateRouteConfig(): RouteObject[] {
  // $ 为layout文件   在文件中包含 $.tsx
  const { $, ...pathConfig } = generatePathConfig();
  return [
    {
      path: '/',
      element: wrapSuspense($),
      children: mapPathConfigToRoute(pathConfig),
    },
  ];
}

const routeConfig = generateRouteConfig();

export default function PageRoutes() {
  return useRoutes(routeConfig);
}
