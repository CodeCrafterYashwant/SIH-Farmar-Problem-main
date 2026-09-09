'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiRequest } from '../utils/api';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  Wheat,
  Building2,
  HelpCircle,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Scale,
  Clock,
  FileText
} from 'lucide-react';

// Static MSP Reference Data (Government of India 2026-27 Benchmarks)
const MSP_DATA = [
  { cropEn: 'Wheat', cropHi: 'गेहूं', mspPerQtl: 2275, ratePerKg: 22.75, category: 'Rabi' },
  { cropEn: 'Paddy (Common)', cropHi: 'धान (साधारण)', mspPerQtl: 2183, ratePerKg: 21.83, category: 'Kharif' },
  { cropEn: 'Mustard', cropHi: 'सरसों', mspPerQtl: 5650, ratePerKg: 56.50, category: 'Rabi' },
  { cropEn: 'Soybean', cropHi: 'सोयाबीन', mspPerQtl: 4600, ratePerKg: 46.00, category: 'Kharif' },
  { cropEn: 'Gram (Chana)', cropHi: 'चना', mspPerQtl: 5440, ratePerKg: 54.40, category: 'Rabi' },
  { cropEn: 'Maize', cropHi: 'मक्का', mspPerQtl: 2090, ratePerKg: 20.90, category: 'Kharif' },
  { cropEn: 'Cotton (Long Staple)', cropHi: 'कपास', mspPerQtl: 7020, ratePerKg: 70.20, category: 'Commercial' },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('hi'); // 'hi' or 'en'
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [centres, setCentres] = useState([]);
  const [loadingCentres, setLoadingCentres] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'नमस्ते किसान भाई! मैं ई-उपार्जन किसान सहायक हूँ। आप बोलकर या लिखकर फसलों का न्यूनतम समर्थन मूल्य (MSP), नजदीकी उपार्जन केंद्र, या पूरी तौल प्रक्रिया के बारे में जान सकते हैं।',
      textEn: 'Hello Farmer! I am your e-Procurement Assistant. You can speak or type to check Government MSP rates, find nearby Mandi centres, or learn the full 5-step procurement process.',
      timestamp: new Date(),
    },
  ]);

  // Load centres on mount for real-time Mandi query answering
  useEffect(() => {
    const fetchCentres = async () => {
      try {
        setLoadingCentres(true);
        const res = await apiRequest('/api/centres');
        if (res.centres) {
          setCentres(res.centres);
        }
      } catch (err) {
        console.error('Chatbot centres fetch error:', err);
      } finally {
        setLoadingCentres(false);
      }
    };
    fetchCentres();

    // Check Speech Recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery(transcript);
          handleProcessQuery(transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Update recognition language when lang toggles
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [lang]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Text to Speech
  const speakText = (text) => {
    if (!soundEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const cleanText = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS error:', e);
    }
  };

  // Toggle Voice Recognition
  const toggleListening = () => {
    if (!speechSupported) {
      alert(lang === 'hi' ? 'आपके ब्राउज़र में वॉयस रिकॉग्निशन समर्थित नहीं है। कृपया टाइप करें।' : 'Voice recognition is not supported in this browser. Please type.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Natural Language Knowledge Processor
  const handleProcessQuery = (queryText) => {
    const raw = queryText.trim();
    if (!raw) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: raw,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Process answer
    setTimeout(() => {
      const botResponse = generateBotResponse(raw.toLowerCase());
      setMessages((prev) => [...prev, botResponse]);
      speakText(lang === 'hi' ? botResponse.text : (botResponse.textEn || botResponse.text));
    }, 400);
  };

  const generateBotResponse = (lower) => {
    const isHi = lang === 'hi';

    // 1. MSP Queries
    if (
      lower.includes('msp') ||
      lower.includes('भाव') ||
      lower.includes('रेट') ||
      lower.includes('मूल्य') ||
      lower.includes('rate') ||
      lower.includes('price') ||
      lower.includes('wheat') ||
      lower.includes('गेहूं') ||
      lower.includes('गेहूँ') ||
      lower.includes('paddy') ||
      lower.includes('धान') ||
      lower.includes('chawal') ||
      lower.includes('सरसों') ||
      lower.includes('mustard') ||
      lower.includes('सोयाबीन') ||
      lower.includes('soybean') ||
      lower.includes('चना') ||
      lower.includes('gram')
    ) {
      // Check specific crop
      let matchedCrop = null;
      if (lower.includes('wheat') || lower.includes('गेहूं') || lower.includes('गेहूँ')) {
        matchedCrop = MSP_DATA.find((c) => c.cropEn === 'Wheat');
      } else if (lower.includes('mustard') || lower.includes('सरसों')) {
        matchedCrop = MSP_DATA.find((c) => c.cropEn === 'Mustard');
      } else if (lower.includes('soybean') || lower.includes('सोयाबीन')) {
        matchedCrop = MSP_DATA.find((c) => c.cropEn === 'Soybean');
      } else if (lower.includes('paddy') || lower.includes('धान')) {
        matchedCrop = MSP_DATA.find((c) => c.cropEn.startsWith('Paddy'));
      } else if (lower.includes('चना') || lower.includes('gram')) {
        matchedCrop = MSP_DATA.find((c) => c.cropEn.startsWith('Gram'));
      }

      if (matchedCrop) {
        return {
          id: Date.now() + 1,
          sender: 'bot',
          type: 'crop_single',
          crop: matchedCrop,
          text: `🌾 शासकीय न्यूनतम समर्थन मूल्य (MSP):\n${matchedCrop.cropHi} (${matchedCrop.cropEn}): ₹${matchedCrop.mspPerQtl} प्रति क्विंटल (या ₹${matchedCrop.ratePerKg} प्रति किलो)। इस दर पर पंजीकृत उपार्जन केंद्रों पर भुगतान सीधे आपके आधार लिंक बैंक खाते में अंतरित होगा।`,
          textEn: `🌾 Govt MSP Rate:\n${matchedCrop.cropEn}: ₹${matchedCrop.mspPerQtl} per Quintal (or ₹${matchedCrop.ratePerKg} per kg). All procurement centres guarantee this MSP directly to your bank account via DBT.`,
          timestamp: new Date(),
        };
      }

      // General MSP List
      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'msp_list',
        text: '🌾 शासन द्वारा घोषित प्रमुख फसलों के न्यूनतम समर्थन मूल्य (MSP):\n• गेहूं (Wheat): ₹2,275/क्विंटल (₹22.75/किग्रा)\n• सरसों (Mustard): ₹5,650/क्विंटल (₹56.50/किग्रा)\n• सोयाबीन (Soybean): ₹4,600/क्विंटल (₹46.00/किग्रा)\n• धान (Paddy): ₹2,183/क्विंटल (₹21.83/किग्रा)\n• चना (Gram): ₹5,440/क्विंटल (₹54.40/किग्रा)\n\nउपार्जन केंद्रों पर तौल के उपरांत पूरा भुगतान 24 से 48 घंटे में सीधे बैंक खाते में जमा किया जाता है।',
        textEn: '🌾 Current Govt MSP Benchmark Rates:\n• Wheat: ₹2,275/Qtl (₹22.75/kg)\n• Mustard: ₹5,650/Qtl (₹56.50/kg)\n• Soybean: ₹4,600/Qtl (₹46.00/kg)\n• Paddy: ₹2,183/Qtl (₹21.83/kg)\n• Gram: ₹5,440/Qtl (₹54.40/kg)\n\nFull payment is disbursed directly into your Aadhaar-linked bank account within 24-48 hours.',
        timestamp: new Date(),
      };
    }

    // 2. Mandi Centres Queries
    if (
      lower.includes('mandi') ||
      lower.includes('मंडी') ||
      lower.includes('केंद्र') ||
      lower.includes('centre') ||
      lower.includes('center') ||
      lower.includes('उपार्जन') ||
      lower.includes('district') ||
      lower.includes('जिला')
    ) {
      // Look for district match
      let filtered = centres;
      const words = lower.split(/\s+/);
      for (const w of words) {
        if (w.length > 3) {
          const match = centres.filter((c) => c.district.toLowerCase().includes(w) || c.name.toLowerCase().includes(w));
          if (match.length > 0) {
            filtered = match;
            break;
          }
        }
      }

      const sampleCentres = filtered.slice(0, 4);
      const listTextHi = sampleCentres.map((c) => `• ${c.name} (${c.district}) [कोड: ${c.code}] — रेटिंग: ${c.averageRating ? c.averageRating.toFixed(1) + '★' : 'नया केंद्र'}`).join('\n');
      const listTextEn = sampleCentres.map((c) => `• ${c.name} (${c.district}) [Code: ${c.code}] — Rating: ${c.averageRating ? c.averageRating.toFixed(1) + '★' : 'New'}`).join('\n');

      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'centres_list',
        text: `📍 सक्रिय उपार्जन केंद्र (कुल ${centres.length} केंद्र सक्रिय हैं):\n${listTextHi}\n\nआप होमपेज पर 'उपार्जन केंद्र संदर्शिका' में जाकर अपने जिले के सभी केंद्रों की रेटिंग देख सकते हैं और स्लॉट बुक कर सकते हैं।`,
        textEn: `📍 Active Procurement Mandis (${centres.length} centres active):\n${listTextEn}\n\nYou can view all Mandi centres, star ratings, and book appointment slots in the Mandi Directory.`,
        timestamp: new Date(),
      };
    }

    // 3. Procurement Process Queries
    if (
      lower.includes('process') ||
      lower.includes('प्रक्रिया') ||
      lower.includes('kaise') ||
      lower.includes('कैसे') ||
      lower.includes('steps') ||
      lower.includes('चरण') ||
      lower.includes('book') ||
      lower.includes('बुकिंग') ||
      lower.includes('nirdesh') ||
      lower.includes('नियम')
    ) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'process',
        text: '📋 उपार्जन की 5-चरणीय पारदर्शी डिजिटल प्रक्रिया:\n\n1. किसान पंजीयन (Registration): आधार व बैंक पासबुक से खाता बनाएं।\n2. स्लॉट बुकिंग (Slot Booking): नजदीकी मंडी व तिथि चुनें, डिजिटल टोकन पर्ची प्राप्त करें।\n3. गेट आगमन (Gate Check-In): मंडी गेट पर टोकन दिखाएं, एसएमएस/ईमेल व कांटा पंक्ति क्रम प्राप्त होगा।\n4. गुणवत्ता व कांटा तौल (Weighment): नमी मीटर व प्रमाणित इलेक्ट्रॉनिक कांटे पर तौल उपरांत डिजिटल देयक पर्ची मिलेगी।\n5. डीबीटी भुगतान (DBT Payout): 24-48 घंटे में PFMS/RTGS द्वारा सीधे आपके बैंक खाते में राशि जमा होगी।',
        textEn: '📋 5-Step Transparent Procurement Process:\n\n1. Registration: Sign up with Aadhaar, mobile & bank passbook.\n2. Slot Booking: Pick a nearby Mandi and preferred date to get a Digital Token Slip.\n3. Gate Check-In: Present token at Mandi gate; get instant queue sequence and SMS/email confirmation.\n4. Certified Weighment: Moisture test & electronic weighbridge with automated digital payout voucher.\n5. DBT Treasury Settlement: Guaranteed direct bank transfer within 24-48 hours via PFMS.',
        timestamp: new Date(),
      };
    }

    // 4. Moisture & Quality queries
    if (
      lower.includes('moisture') ||
      lower.includes('नमी') ||
      lower.includes('गुणवत्ता') ||
      lower.includes('quality') ||
      lower.includes('grade') ||
      lower.includes('ग्रेड')
    ) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '💧 नमी एवं गुणवत्ता मानक (FAQ Guidelines):\n• गेहूं (Wheat): अधिकतम 12% नमी स्वीकार्य है।\n• सरसों (Mustard): अधिकतम 8% नमी स्वीकार्य है।\n• सोयाबीन (Soybean): अधिकतम 12% नमी स्वीकार्य है।\n• धान (Paddy): अधिकतम 17% नमी स्वीकार्य है।\n\nसुझाव: उपज को अच्छी तरह सुखाकर व छानकर लाएं जिससे "Grade A" गुणवत्ता मिले और बिना किसी कटौती के पूरा समर्थन मूल्य प्राप्त हो सके।',
        textEn: '💧 Moisture & Quality Specifications:\n• Wheat: Maximum 12% moisture allowed.\n• Mustard: Maximum 8% moisture allowed.\n• Soybean: Maximum 12% moisture allowed.\n• Paddy: Maximum 17% moisture allowed.\n\nTip: Dry and clean your grain thoroughly before visiting the Mandi to ensure Grade A acceptance and maximum MSP payout.',
        timestamp: new Date(),
      };
    }

    // 5. Gate timing & Documents
    if (
      lower.includes('time') ||
      lower.includes('समय') ||
      lower.includes('दस्तावेज') ||
      lower.includes('document') ||
      lower.includes('timing') ||
      lower.includes('कागजात') ||
      lower.includes('help') ||
      lower.includes('हेल्प')
    ) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⏱️ मंडी समय एवं आवश्यक दस्तावेज:\n• मंडी गेट समय: प्रातः 08:00 बजे से सायं 06:00 बजे तक।\n• आवश्यक दस्तावेज:\n  1. डिजिटल टोकन पर्ची (मोबाइल या प्रिंट)\n  2. आधार कार्ड / किसान पंजीयन पहचान\n  3. बैंक पासबुक की प्रति (DBT सत्यापन हेतु)\n\nहेल्पलाइन: किसान कॉल सेंटर 1800-180-1551 (प्रातः 6:00 से रात्रि 10:00 बजे तक निःशुल्क)।',
        textEn: '⏱️ Mandi Timings & Documents Checklist:\n• Gate Hours: 08:00 AM to 06:00 PM.\n• Required Documents:\n  1. Digital Token Slip (on phone or print)\n  2. Aadhaar Card / Farmer ID\n  3. Bank Passbook copy (for DBT verification)\n\nHelpline: Kisan Call Centre 1800-180-1551 (Toll-Free 6:00 AM - 10:00 PM).',
        timestamp: new Date(),
      };
    }

    // Default Fallback Response
    return {
      id: Date.now() + 1,
      sender: 'bot',
      text: `धन्यवाद किसान भाई! आप मुझसे निम्नलिखित विषयों पर पूछ सकते हैं:\n1. 🌾 फसलों का समर्थन मूल्य (जैसे: 'गेहूं का MSP क्या है?')\n2. 📍 नजदीकी उपार्जन केंद्र (जैसे: 'सीहोर की मंडियां')\n3. 📋 पूरी प्रक्रिया (जैसे: 'उपार्जन कैसे होता है?')\n4. 💧 नमी और गुणवत्ता के नियम\n\nआप माइक्रोफोन बटन दबाकर सीधे बोल भी सकते हैं!`,
      textEn: `Thank you! You can ask me about:\n1. 🌾 Govt MSP rates (e.g. 'Wheat MSP')\n2. 📍 Mandi locations & ratings\n3. 📋 5-Step procurement process\n4. 💧 Moisture and quality guidelines\n\nFeel free to tap the microphone icon to speak!`,
      timestamp: new Date(),
    };
  };

  const handleChipClick = (query) => {
    handleProcessQuery(query);
  };

  return (
    <>
      {/* Floating Widget Launcher Button (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-300 shadow-lg animate-bounce duration-1000">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-800">
              {lang === 'hi' ? '🌾 बोलकर MSP या मंडी पूछें!' : '🌾 Ask MSP or Mandi by Voice!'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-800 to-teal-600 hover:from-emerald-700 hover:to-teal-500 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white group relative"
            aria-label="Open Kisan AI Chatbot"
          >
            <Bot className="w-7 h-7 group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></span>
          </button>
        </div>
      )}

      {/* Expandable Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-emerald-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-body">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold tracking-tight">
                    {lang === 'hi' ? 'किसान सहायक AI' : 'Kisan Sahayak AI'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-emerald-200 text-[9px] font-bold border border-emerald-400/30">
                    VOICE READY
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/90 font-light">
                  {lang === 'hi' ? 'शासकीय समर्थन मूल्य एवं उपार्जन संदर्शिका' : 'Govt MSP & Procurement Guide'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white border border-white/20 transition-colors"
                title="Switch Language / भाषा बदलें"
              >
                {lang === 'hi' ? 'English' : 'हिंदी'}
              </button>

              {/* Sound readout toggle */}
              <button
                type="button"
                onClick={() => {
                  if (soundEnabled && typeof window !== 'undefined') {
                    window.speechSynthesis?.cancel();
                  }
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                title={soundEnabled ? 'Mute Voice Readout' : 'Enable Voice Readout'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="bg-emerald-50/80 border-b border-emerald-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] shrink-0">
            <button
              onClick={() => handleChipClick(lang === 'hi' ? 'गेहूं और सरसों का MSP क्या है?' : 'What is Wheat and Mustard MSP?')}
              className="px-2.5 py-1 rounded-full bg-white border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100/70 whitespace-nowrap shadow-2xs transition-colors shrink-0 flex items-center gap-1"
            >
              <Wheat className="w-3 h-3 text-emerald-700" />
              <span>{lang === 'hi' ? 'फसल MSP भाव' : 'MSP Rates'}</span>
            </button>
            <button
              onClick={() => handleChipClick(lang === 'hi' ? 'उपलब्ध उपार्जन केंद्र बताएं' : 'Show available mandi centres')}
              className="px-2.5 py-1 rounded-full bg-white border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100/70 whitespace-nowrap shadow-2xs transition-colors shrink-0 flex items-center gap-1"
            >
              <Building2 className="w-3 h-3 text-emerald-700" />
              <span>{lang === 'hi' ? 'नजदीकी मंडियां' : 'Mandis'}</span>
            </button>
            <button
              onClick={() => handleChipClick(lang === 'hi' ? 'उपार्जन की पूरी प्रक्रिया बताएं' : 'Explain entire procurement process')}
              className="px-2.5 py-1 rounded-full bg-white border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100/70 whitespace-nowrap shadow-2xs transition-colors shrink-0 flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-emerald-700" />
              <span>{lang === 'hi' ? 'तौल प्रक्रिया' : 'Full Process'}</span>
            </button>
            <button
              onClick={() => handleChipClick(lang === 'hi' ? 'नमी व गुणवत्ता नियम क्या हैं?' : 'What are moisture and grade rules?')}
              className="px-2.5 py-1 rounded-full bg-white border border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-100/70 whitespace-nowrap shadow-2xs transition-colors shrink-0 flex items-center gap-1"
            >
              <Scale className="w-3 h-3 text-emerald-700" />
              <span>{lang === 'hi' ? 'नमी नियम' : 'Moisture'}</span>
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              const displayText = lang === 'hi' ? m.text : (m.textEn || m.text);

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isBot
                        ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                        : 'bg-emerald-850 bg-emerald-900 text-white shadow-sm rounded-br-none'
                    }`}
                  >
                    <p className="whitespace-pre-line font-body">{displayText}</p>

                    {/* Crop Card Highlight for specific single crops */}
                    {m.type === 'crop_single' && m.crop && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                            {m.crop.category} Season
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {lang === 'hi' ? m.crop.cropHi : m.crop.cropEn}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-900 font-data block">
                            ₹{m.crop.mspPerQtl}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">per Quintal</span>
                        </div>
                      </div>
                    )}

                    {/* Quick navigation link for mandi queries */}
                    {m.type === 'centres_list' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          href="/centres"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                        >
                          <span>{lang === 'hi' ? 'सभी उपार्जन केंद्र देखें →' : 'Browse All Mandis →'}</span>
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isBot && soundEnabled && (
                        <button
                          type="button"
                          onClick={() => speakText(displayText)}
                          className="text-slate-400 hover:text-emerald-700 p-0.5 ml-2"
                          title="Listen Again"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Listening Wave Visualizer when Microphone is active */}
            {isListening && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-ping"></div>
                <span>{lang === 'hi' ? 'सुन रहा हूँ... कृपया बोलिए (उदा: गेहूं का MSP क्या है?)' : 'Listening... Please speak now (e.g. What is Wheat MSP?)'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessQuery(inputQuery);
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-600 text-white animate-bounce shadow-md'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak / बोलकर पूछें'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  isListening
                    ? (lang === 'hi' ? 'सुन रहा हूँ...' : 'Listening...')
                    : (lang === 'hi' ? 'यहाँ बोलें या लिखें (उदा: सरसों का MSP)...' : 'Type or speak your question...')
                }
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between px-1 mt-1.5 text-[10px] text-slate-400">
              <span>{lang === 'hi' ? '✓ बिना लॉगिन सीधे पूछें' : '✓ No login required'}</span>
              <span>{lang === 'hi' ? 'हिंदी व English वॉयस समर्थित' : 'Hindi & English Voice Ready'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
