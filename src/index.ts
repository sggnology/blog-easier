import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
	const html = await c.env.ASSETS.fetch(new Request('index.html')).then(res => res.text());
	return c.html(html);
})

interface SimpleQueryParams {
	keyword: string
}

app.post('/api/normal', async (c) => {

	// get body params
	const bodyParams: SimpleQueryParams = await c.req.json();

	// if keyword is empty throw
	if (!bodyParams.keyword) {
		return c.json({ error: 'Keyword cannot be empty' }, 400);
	}

	const result = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
		messages: [
			{ role: "system", content: "마케팅 전문가로 블로그를 담당하고 있는 전문가" },
			{ role: "user", content: bodyParams.keyword },
			{ role: "assistant", content: "답변 글자수 460자, 제목과 내용에 대한 중제목 소제목 그리고 내용 자체는 요약해서" },
		]
	})
	return c.json(result);
})

export default app