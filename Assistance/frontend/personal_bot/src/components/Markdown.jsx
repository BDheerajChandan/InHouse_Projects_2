// frontend/personal_bot/src/components/Markdown.jsx
function inline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((p, i) => {
    if (p.length > 2 && p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return p;
  });
}

export default function Markdown({ text }) {
  return text.split("```").map((block, i) =>
    i % 2 ? (
      <pre key={i}>
        <code>{block.replace(/^\w*\n/, "")}</code>
      </pre>
    ) : block.trim() ? (
      <p key={i} className="md">
        {inline(block.trim())}
      </p>
    ) : null
  );
}