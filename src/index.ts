import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
	const html = await c.env.ASSETS.fetch(new Request('index.html')).then(res => res.text());
	return c.html(html);
})

type SimpleQueryParams = {
	keyword: string
}

const initialMessage: RoleScopedChatInput[] = [
	{ role: "system", content: "마케팅 전문가로써 블로그 작성에 일가견이 있다. 1000자 이내로 답변하며 주로 어떻게 작성하면 좋을지 도움을 준다." }
];

let accumulatedMessages: RoleScopedChatInput[] = [];

app.post('/api/normal', async (c) => {

	// get body params
	const bodyParams: SimpleQueryParams = await c.req.json();

	// if keyword is empty throw
	if (!bodyParams.keyword) {
		return c.json({ error: 'Keyword cannot be empty' }, 400);
	}

	accumulatedMessages = [
		...accumulatedMessages,
		{ role: "user", content: bodyParams.keyword },
	]

	const result: AiTextGenerationOutput = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
		max_tokens: 1024,
		messages: [
			...initialMessage,
			...accumulatedMessages
		]
	})

	if (result instanceof ReadableStream) {
		const reader = result.getReader();
		let response_content = '';

		const decoder = new TextDecoder();
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			response_content += decoder.decode(value);
		}

		accumulatedMessages = [
			...accumulatedMessages,
			{ role: "assistant", content: response_content }
		];
	}
	else {
		accumulatedMessages = [
			...accumulatedMessages,
			{ role: "assistant", content: result?.response ?? "" }
		];
	}

	return c.json(result);
})

export default app