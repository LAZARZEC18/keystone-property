import { onRequest as __api_config_js_onRequest } from "/home/claude/keystone/functions/api/config.js"
import { onRequest as __api_contact_js_onRequest } from "/home/claude/keystone/functions/api/contact.js"
import { onRequest as __api_geocode_js_onRequest } from "/home/claude/keystone/functions/api/geocode.js"
import { onRequest as __api_hit_js_onRequest } from "/home/claude/keystone/functions/api/hit.js"
import { onRequest as __api_listings_js_onRequest } from "/home/claude/keystone/functions/api/listings.js"
import { onRequest as __api_live_news_js_onRequest } from "/home/claude/keystone/functions/api/live-news.js"
import { onRequest as __api_live_rba_js_onRequest } from "/home/claude/keystone/functions/api/live-rba.js"
import { onRequest as __api_photos_js_onRequest } from "/home/claude/keystone/functions/api/photos.js"
import { onRequest as __api_property_js_onRequest } from "/home/claude/keystone/functions/api/property.js"
import { onRequest as ___middleware_js_onRequest } from "/home/claude/keystone/functions/_middleware.js"

export const routes = [
    {
      routePath: "/api/config",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_config_js_onRequest],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_contact_js_onRequest],
    },
  {
      routePath: "/api/geocode",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_geocode_js_onRequest],
    },
  {
      routePath: "/api/hit",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_hit_js_onRequest],
    },
  {
      routePath: "/api/listings",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_listings_js_onRequest],
    },
  {
      routePath: "/api/live-news",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_live_news_js_onRequest],
    },
  {
      routePath: "/api/live-rba",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_live_rba_js_onRequest],
    },
  {
      routePath: "/api/photos",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_photos_js_onRequest],
    },
  {
      routePath: "/api/property",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_property_js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]