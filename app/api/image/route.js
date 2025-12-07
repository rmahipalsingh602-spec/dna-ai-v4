export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const prompt = body.prompt || "";
    const style = body.style || "logo";

    if (!prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fullPrompt = `Style: ${style}. ${prompt}`;

    const apiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: fullPrompt,
        size: "1024x1024",
        n: 2,
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error("Image error:", data);
      return new Response(
        JSON.stringify({ error: "OpenAI image error", details: data }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const urls = (data.data || []).map((item) => item.url).filter(Boolean);

    return new Response(JSON.stringify({ urls }), {
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
