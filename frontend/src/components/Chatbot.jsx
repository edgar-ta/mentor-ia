import { useState } from 'react';
import api from '../lib/api';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hola, soy MentorIA. Pregunta por tu próxima sesión o solicita un recordatorio.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/chat', { message: userMsg.text });
      setMessages((prev) => [...prev, { from: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: 'No pude conectar al backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel chat">
      <h2 className="chat-title">
  🤖 MentorIA Assistant
</h2>
      <div className="chat-window">
        {messages.map((m, idx) => (
          <div key={idx} className={`bubble ${m.from}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="bubble bot">Escribiendo...</div>}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe tu mensaje..."
        />
        <button className="primary" onClick={sendMessage}>Enviar</button>
      </div>
    </section>
  );
};

export default Chatbot;
