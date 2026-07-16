import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Navbar from '../components/Navbar';

const colors = [
  '#ffadad', // Red
  '#ffd6a5', // Orange
  '#fdffb6', // Yellow
  '#caffbf', // Green
  '#9bf6ff', // Cyan
  '#a0c4ff', // Blue
  '#bdb2ff', // Purple
  '#ffc6ff', // Pink
  '#fffffc'  // White
];

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const TURNSTILE_ACTION = 'submit_note';

const Submit = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    to_name: '',
    message: '',
    alias: '',
    color: '#fffffc'
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Render the Turnstile widget inside the confirmation modal.
  const widgetIdRef = useRef(null);
  useEffect(() => {
    if (!showConfirm || !TURNSTILE_SITE_KEY) return;
    const render = () => {
      if (!window.turnstile) return;
      if (document.getElementById('turnstile-widget')) {
        const id = window.turnstile.render('#turnstile-widget', {
          sitekey: TURNSTILE_SITE_KEY,
          action: TURNSTILE_ACTION,
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileToken(''),
        });
        widgetIdRef.current = id;
      }
    };

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = render;
      document.body.appendChild(script);
    }

    // Reset any prior token each time the modal opens.
    setTurnstileToken('');
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [showConfirm]);

  // Constants
  const MAX_CHARS = 300;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: validate, then open the confirmation modal (do NOT submit yet).
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.message.trim()) {
      setError('Message is required.');
      return;
    }

    setShowConfirm(true);
  };

  // Step 2: submit from the modal after the captcha is solved.
  const confirmPost = async () => {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Please complete the captcha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, turnstileToken }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('You are doing that too much. Please wait a bit.');
        }
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to post note');
      }

      setShowConfirm(false);
      navigate('/browse');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setError(null);
  };

  return (
    <div
      className="min-h-screen pt-20 pb-10 px-4 flex justify-center items-center"
      style={{
        backgroundColor: '#fdfbf7', // Paper White
        // CSS Gradients to create the notebook lines
        backgroundImage: `
          linear-gradient(90deg, transparent 40px, #ab161520 41px, transparent 41px),
          repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 28px)
        `,
        backgroundAttachment: 'local'
      }}
    >
      <Navbar />

      <div className="w-full max-w-lg">
        {/* Sticky Note Form Container */}
        <div
          className="relative w-full aspect-square sm:aspect-[4/5] shadow-2xl p-8 flex flex-col transition-colors duration-300 transform rotate-1"
          style={{
            backgroundColor: formData.color,
            fontFamily: '"Caveat", cursive',
          }}
        >
          {/* Tape Visual */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-md rotate-[-2deg] shadow-sm border border-white/20"></div>

          <form onSubmit={handleSubmit} className="h-full flex flex-col gap-4">

            {/* Header */}
            <h1 className="text-3xl font-bold text-black/70 text-center mb-2">Write a Note</h1>

            {/* Error Message */}
            {error && !showConfirm && (
              <div className="bg-red-500/20 text-red-900 px-4 py-2 rounded-md text-center font-sans text-sm font-bold border border-red-500/30">
                {error}
              </div>
            )}

            {/* To Field */}
            <div className="flex flex-col">
              <label className="text-xl font-bold text-black/60 pl-1">To:</label>
              <input
                type="text"
                name="to_name"
                value={formData.to_name}
                onChange={handleChange}
                placeholder="Someone special..."
                className="bg-transparent border-b-2 border-black/10 focus:border-black/40 outline-none text-2xl px-2 py-1 placeholder:text-black/20"
                maxLength={50}
              />
            </div>

            {/* Message Field */}
            <div className="flex flex-col flex-grow relative">
              <label className="text-xl font-bold text-black/60 pl-1">Message:</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={MAX_CHARS}
                placeholder="Type your message here..."
                className="w-full h-full bg-transparent resize-none outline-none text-2xl leading-relaxed p-2 placeholder:text-black/20"
              />
              {/* Character Counter */}
              <div className={`absolute bottom-0 right-0 text-sm font-bold font-sans pointer-events-none transition-colors ${
                formData.message.length >= MAX_CHARS ? 'text-red-500' : 'text-black/30'
              }`}>
                {formData.message.length} / {MAX_CHARS}
              </div>
            </div>

            {/* Alias Field */}
            <div className="flex flex-col items-end">
              <div className="w-2/3 flex items-center gap-2 border-b-2 border-black/10 focus-within:border-black/40">
                <span className="text-xl font-bold text-black/60">-</span>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="Your alias (optional)"
                  className="w-full bg-transparent outline-none text-xl py-1 placeholder:text-black/20 text-right"
                  maxLength={30}
                />
              </div>
            </div>

            {/* Color Picker */}
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-black/5">
              <div className="flex gap-2 flex-wrap max-w-[70%]">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-6 h-6 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110 ${
                      formData.color === c ? 'ring-2 ring-black/30 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/browse')}
                  className="p-2 rounded-full hover:bg-black/5 text-black/60 transition-colors"
                  title="Cancel"
                >
                  <X size={24} />
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="p-2 bg-black/80 text-white rounded-full shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Post Note"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={24} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal with CAPTCHA (matches the sticky-note theme) */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-fadeIn"
          onClick={closeConfirm}
        >
          <div
            className="relative w-full max-w-sm shadow-2xl px-8 py-6 flex flex-col transform rotate-1"
            style={{
              backgroundColor: formData.color,
              fontFamily: '"Caveat", cursive',
              backgroundImage:
                'repeating-linear-gradient(0deg, #00000008 0px, #00000008 1px, transparent 1px, transparent 28px)',
              backgroundAttachment: 'local',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tape Visual */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-white/30 backdrop-blur-md rotate-[-2deg] shadow-sm border border-white/20"></div>

            <button
              onClick={closeConfirm}
              className="absolute top-2 right-2 p-2 hover:bg-black/10 rounded-full transition-colors text-black/50 hover:text-black"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-black/70 text-center mb-0 mt-2">Confirm your note</h2>
            <p className="text-center text-black/50 text-base mb-1">
              Verify you're human before posting.
            </p>
            <p className="text-center text-black/50 text-base mb-1">
              ** For safety lang po, baka i-spam niyo eh. **
            </p>

            {/* Captcha lives inside the sticky-note modal */}
            {TURNSTILE_SITE_KEY && (
              <div id="turnstile-widget" className="flex justify-center min-h-[65px] my-2"></div>
            )}

            {error && (
              <div className="bg-red-500/20 text-red-900 px-4 py-2 rounded-md text-center font-sans text-sm font-bold border border-red-500/30">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-3 mt-auto pt-4">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-5 py-2 rounded-full text-black/60 font-bold hover:bg-black/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPost}
                disabled={loading}
                className="px-6 py-2 rounded-full bg-black/80 text-white font-bold shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                Post Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submit;
