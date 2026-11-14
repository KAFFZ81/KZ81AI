const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return json({ error: "Binding Workers AI belum dipasang. Buka Cloudflare Pages > Settings > Bindings > Add > Workers AI, lalu beri nama AI dan deploy ulang." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Format permintaan tidak valid." }, 400);
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-12)
    .map((message) => {
      const role = message.role === "model" || message.role === "assistant" ? "assistant" : "user";
      const content = message.content || message.parts?.map((part) => part.text || "").join("") || "";
      return { role, content: String(content).slice(0, 10000) };
    })
    .filter((message) => message.content.trim());

  if (!history.length) return json({ error: "Pesan kosong." }, 400);

  const instruction = String(body.instruction || "Kamu adalah KZ81 AI, asisten belajar yang ramah dan menjawab dalam bahasa Indonesia.").slice(0, 3000);
  const messages = [
    { role: "system", content: instruction },
    ...history
  ];

  try {
    const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 1200,
      temperature: 0.6
    });
    const answer = typeof result === "string" ? result : (result?.response || result?.result?.response || "");
    if (!answer) return json({ error: "AI tidak menghasilkan jawaban. Coba kirim pertanyaan lagi." }, 502);
    return json({ text: answer });
  } catch (error) {
    return json({ error: "Workers AI gagal memproses permintaan. Periksa binding AI dan coba lagi." }, 502);
  }
}

export async function onRequestGet() {
  return json({ status: "ok", service: "KZ81 AI - Cloudflare Workers AI" });
}
