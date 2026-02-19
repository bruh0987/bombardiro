export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.ep5Bv7Yz.js",app:"_app/immutable/entry/app.CvdANgwd.js",imports:["_app/immutable/entry/start.ep5Bv7Yz.js","_app/immutable/chunks/JOl3XQ4h.js","_app/immutable/chunks/BJ2tVtY-.js","_app/immutable/chunks/D6-CZzRm.js","_app/immutable/entry/app.CvdANgwd.js","_app/immutable/chunks/BJ2tVtY-.js","_app/immutable/chunks/DY__CSMl.js","_app/immutable/chunks/CG45pcPR.js","_app/immutable/chunks/D6-CZzRm.js","_app/immutable/chunks/BY7mSDuB.js","_app/immutable/chunks/DggFgl_g.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/lobby/create",
				pattern: /^\/api\/lobby\/create\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/lobby/create/_server.ts.js'))
			},
			{
				id: "/api/ws",
				pattern: /^\/api\/ws\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/ws/_server.ts.js'))
			},
			{
				id: "/lobby/[code]",
				pattern: /^\/lobby\/([^/]+?)\/?$/,
				params: [{"name":"code","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
