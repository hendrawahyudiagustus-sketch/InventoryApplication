export default {
	async fetch(request, env, ctx): Promise<Response> {
		return new Response('Hello World from inventory worker!');
	},
} satisfies ExportedHandler<Env>;
