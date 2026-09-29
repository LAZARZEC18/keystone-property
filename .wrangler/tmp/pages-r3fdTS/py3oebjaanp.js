// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/*"],
  exclude: ["/assets/*", "/data/*", "/sitemap.xml", "/robots.txt", "/favicon.ico"]
};

// ../../../tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/claude/keystone/.wrangler/tmp/pages-r3fdTS/functionsWorker-0.6607582097991134.mjs";
import { isRoutingRuleMatch } from "/tmp/claude-0/-home-claude/f3201bd0-f30d-5156-a500-09310b3f6be6/scratchpad/wr/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/claude/keystone/.wrangler/tmp/pages-r3fdTS/functionsWorker-0.6607582097991134.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=py3oebjaanp.js.map
