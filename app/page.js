"use client";

import { useMemo, useState } from "react";

const createInitialSession = () => ({
  id: Date.now(),
  title: "New Chat",
  messages: [
    {
      role: "assistant",
      content:
        "👋 Namaste! Main DNA Ultra AI V4 hoon. Kuch bhi pooch sakte ho — coding, business, study, gaming, ideas!",
    },
  ],
});

export default function Home() {
  const [sessions, setSessions] = useState([createInitialSession()]);
  const [currentId, setCurrentId] = useState(() => sessions[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat"); // chat | image | tools
  const [listening, setListening] = useState(false);
  const [lastAiMessage, setLastAiMessage] = useState("");

  // Image AI state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgStyle, setImgStyle] = useState("logo");
  const [imgLoading, setImgLoading] = useState(false);
  const [images, setImages] = useState([]);

  // Tools state
  const [calcInput, setCalcInput] = useState("");
  const [calcOutput, setCalcOutput] = useState("");
  const [ytInput, setYtInput] = useState("");
  const [ytOutput, setYtOutput] = useState("");
  const [rewriteInput, setRewriteInput] = useState("");
  const [rewriteOutput, setRewriteOutput] = useState("");

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentId) || sessions[0],
    [sessions, currentId]
  );

  const handleNewChat = () => {
    const newSession = createInitialSession();
    setSessions((prev) => [newSession, ...prev]);
    setCurrentId(newSession.id);
  };

  const handleSelectSession = (id) => {
    setCurrentId(id);
  };

  const addTypingMessage = (sessionId, typingId) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [
                ...s.messages,
                { role: "assistant", content: "__TYPING__" + typingId },
              ],
            }
          : s
      )
    );
  };

  const removeTypingMessage = (sessionId, typingId) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.filter(
                (m) => m.content !== "__TYPING__" + typingId
              ),
            }
          : s
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab !== "chat") return; // input sirf chat ke liye
    if (!currentSession || loading) return;

    const text = input.trim();
    if (!text) return;

    setInput("");
    setLoading(true);

    const sessionId = currentSession.id;
    const newMessages = [
      ...currentSession.messages,
      { role: "user", content: text },
    ];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              title:
                s.title === "New Chat" ? text.slice(0, 24) + "..." : s.title,
              messages: newMessages,
            }
          : s
      )
    );

    const typingId = Math.random();
    addTypingMessage(sessionId, typingId);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      const reply =
        data.reply ||
        "Mujhe response nahi mila, thodi der baad phir se try karo.";

      removeTypingMessage(sessionId, typingId);

      setLastAiMessage(reply);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { role: "assistant", content: reply },
                ],
              }
            : s
        )
      );
    } catch (err) {
      console.error(err);
      removeTypingMessage(sessionId, typingId);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    role: "assistant",
                    content:
                      "⚠️ Error aa gaya.\n\nCheck karo:\n• Internet theek hai?\n• OPENAI_API_KEY sahi dala hai?\n• Thodi der baad phir try karo.",
                  },
                ],
              }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ---- VOICE: MIC INPUT (browser SpeechRecognition) ----
  const handleMic = () => {
    if (typeof window === "undefined") return;

    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!SR) {
      alert("Mic speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "hi-IN"; // Hindi + Hinglish
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + text : text));
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  // ---- VOICE: SPEAK LAST AI MESSAGE ----
  const handleSpeak = () => {
    if (typeof window === "undefined") return;
    if (!lastAiMessage) {
      alert("Abhi tak AI ka koi reply nahi mila.");
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      alert("Speech output is not supported in this browser.");
      return;
    }

    const utter = new SpeechSynthesisUtterance(lastAiMessage);
    utter.lang = "hi-IN";
    synth.cancel();
    synth.speak(utter);
  };

  // ---- IMAGE GENERATOR ----
  const handleGenerateImage = async () => {
    const prompt = imgPrompt.trim();
    if (!prompt) return;
    setImgLoading(true);
    setImages([]);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: imgStyle }),
      });

      const data = await res.json();
      if (data.error) {
        alert("Image error: " + data.error);
      } else {
        setImages(data.urls || []);
      }
    } catch (err) {
      console.error(err);
      alert("Kuch galat ho gaya, thodi der baad try karo.");
    } finally {
      setImgLoading(false);
    }
  };

  const handleDownloadImage = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "dna-ai-image.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ---- SIMPLE TOOLS ----
  const runCalculator = () => {
    const expr = calcInput.trim();
    if (!expr) return;
    try {
      // Very simple eval for math only – apne risk par
      // Example: 2+2*3
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      setCalcOutput(String(result));
    } catch (e) {
      setCalcOutput("Expression galat hai.");
    }
  };

  const runYoutubeSummary = async () => {
    const text = ytInput.trim();
    if (!text) return;
    setYtOutput("Thinking…");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a YouTube video summarizer. User will give title, description, or link. Give short Hinglish summary + 3 main points.",
            },
            { role: "user", content: text },
          ],
        }),
      });
      const data = await res.json();
      setYtOutput(data.reply || "Summary nahi bana paya.");
    } catch (e) {
      setYtOutput("Error aaya.");
    }
  };

  const runRewrite = async () => {
    const text = rewriteInput.trim();
    if (!text) return;
    setRewriteOutput("Thinking…");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a writing improver. Rewrite text in more professional English, but simple.",
            },
            { role: "user", content: text },
          ],
        }),
      });
      const data = await res.json();
      setRewriteOutput(data.reply || "Nahi ho paya.");
    } catch (e) {
      setRewriteOutput("Error aaya.");
    }
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="side-title">
          DNA<span>AI</span>
        </h2>

        <button className="new-chat-btn" onClick={handleNewChat}>
          + New Chat
        </button>

        <div className="mode-switcher">
          <button
            className={`mode-pill ${tab === "chat" ? "active" : ""}`}
            onClick={() => setTab("chat")}
          >
            Chat
          </button>
          <button
            className={`mode-pill ${tab === "image" ? "active" : ""}`}
            onClick={() => setTab("image")}
          >
            Images
          </button>
          <button
            className={`mode-pill ${tab === "tools" ? "active" : ""}`}
            onClick={() => setTab("tools")}
          >
            Tools
          </button>
        </div>

        <div className="history-label">Chat History</div>
        <div className="history">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="history-item"
              onClick={() => setCurrentId(session.id)}
              style={{
                borderColor:
                  session.id === currentId
                    ? "rgba(96, 165, 250, 0.9)"
                    : "rgba(75, 85, 99, 0.9)",
              }}
            >
              {session.title}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="header">
          <div className="header-top">
            <div>
              <h1>DNA Ultra AI V4 ⚡</h1>
              <p>Next-gen intelligence · Secure backend · One-page experience</p>
            </div>
          </div>
          <div className="tab-row">
            <button
              className={`tab-btn ${tab === "chat" ? "active" : ""}`}
              onClick={() => setTab("chat")}
            >
              🧠 Chat
            </button>
            <button
              className={`tab-btn ${tab === "image" ? "active" : ""}`}
              onClick={() => setTab("image")}
            >
              🎨 Image AI
            </button>
            <button
              className={`tab-btn ${tab === "tools" ? "active" : ""}`}
              onClick={() => setTab("tools")}
            >
              🛠 Tools
            </button>
          </div>
        </header>

        {/* TAB CONTENT */}
        {tab === "chat" && (
          <>
            <div className="chat-box">
              {currentSession?.messages.map((msg, idx) => {
                const isTyping = msg.content.startsWith("__TYPING__");
                if (isTyping) {
                  return (
                    <div key={idx} className="msg ai">
                      <div className="typing">
                        <div className="dot" />
                        <div className="dot" />
                        <div className="dot" />
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className={`msg ${
                      msg.role === "user" ? "user" : "ai"
                    }`}
                  >
                    {msg.content}
                  </div>
                );
              })}
            </div>

            <footer className="footer">
              <form className="form" onSubmit={handleSubmit}>
                <input
                  id="user-input"
                  type="text"
                  placeholder="Ask DNA Ultra AI V4 anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <div className="input-buttons">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleMic}
                    title="Speak (mic)"
                  >
                    {listening ? "🎙" : "🎤"}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleSpeak}
                    title="Listen AI reply"
                  >
                    🔊
                  </button>
                  <button id="send-btn" type="submit" disabled={loading}>
                    {loading ? "…" : "➤"}
                  </button>
                </div>
              </form>
            </footer>
          </>
        )}

        {tab === "image" && (
          <div className="image-panel">
            <div className="image-form">
              <textarea
                placeholder="Describe the image you want (Hindi/English)..."
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
              />
              <select
                value={imgStyle}
                onChange={(e) => setImgStyle(e.target.value)}
              >
                <option value="logo">Logo / Icon</option>
                <option value="anime">Anime / Cartoon</option>
                <option value="realistic">Realistic Photo</option>
                <option value="3d">3D Render</option>
                <option value="concept">Concept Art</option>
              </select>
              <button type="button" onClick={handleGenerateImage}>
                {imgLoading ? "Generating..." : "Generate"}
              </button>
            </div>

            <div className="image-grid">
              {images.map((url, idx) => (
                <div key={idx} className="image-card">
                  <img src={url} alt="AI generated" />
                  <div className="image-card-footer">
                    <span>Result {idx + 1}</span>
                    <button onClick={() => handleDownloadImage(url)}>
                      Download
                    </button>
                  </div>
                </div>
              ))}
              {!imgLoading && images.length === 0 && (
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Tip: Try prompts like “modern gaming logo DNA AI, neon, dark background”
                  ya “realistic Indian city street at night, cyberpunk”.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "tools" && (
          <div className="tools-panel">
            <div className="tool-card">
              <h3>🧮 Smart Calculator</h3>
              <p>Simple expression likho (jaise: 2000*12+5000/2)</p>
              <input
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
                placeholder="2+2*3"
              />
              <button type="button" onClick={runCalculator}>
                Calculate
              </button>
              {calcOutput && (
                <div className="tool-output">Result: {calcOutput}</div>
              )}
            </div>

            <div className="tool-card">
              <h3>📹 YouTube Summary</h3>
              <p>Video ka title / description / link paste karo.</p>
              <textarea
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                placeholder="Paste YouTube link or description..."
              />
              <button type="button" onClick={runYoutubeSummary}>
                Summarize
              </button>
              {ytOutput && (
                <div className="tool-output">{ytOutput}</div>
              )}
            </div>

            <div className="tool-card">
              <h3>✍ Text Improve (English)</h3>
              <p>Apna text daalo, AI ise better English me likhega.</p>
              <textarea
                value={rewriteInput}
                onChange={(e) => setRewriteInput(e.target.value)}
                placeholder="Write something you want to improve..."
              />
              <button type="button" onClick={runRewrite}>
                Rewrite
              </button>
              {rewriteOutput && (
                <div className="tool-output">{rewriteOutput}</div>
              )}
            </div>

            <div className="tool-card">
              <h3>ℹ Tips</h3>
              <p>
                Ye sab tools same DNA AI brain use karte hain. Agar chaho to hum
                future me database, login, full history save bhi add kar sakte
                hain.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
