const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

type Inquiry = { name: string; email: string; phone: string; message: string }

export function renderInquiryEmail({ name, email, phone, message }: Inquiry) {
  const rows = [
    ["Név", name],
    ["E-mail", email],
    ["Telefon", phone || "-"],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#666">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
    )
    .join("")

  return {
    subject: `Új érdeklődés: ${name.replace(/\s+/g, " ")}`,
    html: `<table style="font-family:sans-serif;font-size:15px">${rows}</table><p style="font-family:sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(message)}</p>`,
    text: `Név: ${name}\nE-mail: ${email}\nTelefon: ${phone || "-"}\n\n${message}`,
  }
}
