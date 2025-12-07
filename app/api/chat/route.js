export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY missing in .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const messages = body.messages || [];

    const systemMessage = {
      role: "system",
      content:
        "You are DNA Ultra AI V4, a futuristic assistant for an Indian user. Reply in simple Hinglish unless the user clearly asks for English only. Be clear, friendly and helpful.",
    };

    const chatMessages = [systemMessage, ...messages];

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error("OpenAI error:", data);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: data }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Mujhe response nahi mila, thoda baad try karo.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
