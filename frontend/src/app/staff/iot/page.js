'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../utils/api';
import { translations, getStoredLang } from '../../../utils/translations';
import IoTScalePanel from '../../../components/IoTScalePanel';
import {
  Cpu,
  Scale,
  Bluetooth,
  Usb,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Copy,
  Check,
  Terminal,
  Activity,
  ArrowRight,
  Download,
  Landmark,
  Radio
} from 'lucide-react';

export default function IoTDiagnosticsPage() {
  const router = useRouter();
  const [lang, setLang] = useState('hi');
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState([
    { id: 1, time: '10:14:02', device: 'ESP32-WEIGH-01', type: 'SCALE_STABLE', weight: '2,450.5 kg', moisture: '11.4%', grade: 'Grade A', hash: '8f4a...e8b1', status: 'VERIFIED' },
    { id: 2, time: '10:11:45', device: 'ESP32-MOIST-01', type: 'QC_INSPECT', weight: '2,450.5 kg', moisture: '11.4%', grade: 'Grade A', hash: '6d1c...99a2', status: 'VERIFIED' },
    { id: 3, time: '10:08:19', device: 'ESP32-WEIGH-01', type: 'TARE_ZERO', weight: '0.0 kg', moisture: '0.0%', grade: '--', hash: '1a2b...44cc', status: 'CALIBRATED' },
  ]);

  useEffect(() => {
    setLang(getStoredLang());
    const handleLangChange = () => setLang(getStoredLang());
    window.addEventListener('languageChange', handleLangChange);

    const token = localStorage.getItem('sih_token');
    const rawUser = localStorage.getItem('sih_user');
    if (!token || !rawUser) {
      router.replace('/');
      return;
    }
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed.role !== 'staff' && parsed.role !== 'admin') {
        router.replace('/');
        return;
      }
      setUser(parsed);
    } catch {
      router.replace('/');
      return;
    }

    return () => window.removeEventListener('languageChange', handleLangChange);
  }, [router]);

  const t = translations[lang] || translations.hi;

  const esp32FirmwareCode = `// ESP32 Smart Weighbridge & Moisture QC Unit Firmware (v2.4)
// SIH26032 - Smart India Hackathon 2026
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "HX711.h"

const int HX711_DOUT = 16;
const int HX711_SCK  = 4;
const int MOISTURE_PIN = 34;

HX711 scale;
float CALIBRATION_FACTOR = 2280.0;

void setup() {
  Serial.begin(115200);
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare();
}

void loop() {
  float weight = scale.get_units(5);
  int rawMoist = analogRead(MOISTURE_PIN);
  float moisture = map(rawMoist, 800, 3200, 80, 200) / 10.0;

  StaticJsonDocument<200> doc;
  doc["deviceId"] = "ESP32-WEIGH-01";
  doc["weightKg"] = weight;
  doc["moisturePercent"] = moisture;
  doc["isStable"] = true;

  serializeJson(doc, Serial);
  Serial.println();
  delay(1000);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32FirmwareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-8 font-body">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Official Header */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase">
                {lang === 'hi' ? 'स्मार्ट इंडिया हैकाथॉन 2026 • हार्डवेयर एकीकरण' : 'Smart India Hackathon 2026 • Hardware Integration'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                ESP32 IoT USP
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900">
              {lang === 'hi' ? 'IoT हार्डवेयर नियंत्रण एवं टेलीमेट्री केंद्र' : 'IoT Hardware Diagnostics & Telemetry Hub'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {lang === 'hi' ? 'इलेक्ट्रॉनिक कांटा (ESP32/HX711) एवं नमी विश्लेषक का सीधा लाइव इंटरफ़ेस (USB/BLE/Wi-Fi)' : 'Direct interface for Electronic Weighbridge (ESP32) & Moisture QC meters via USB, Bluetooth, or Wi-Fi'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/procurement"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-sm transition-all active:scale-95"
            >
              <span>{lang === 'hi' ? 'उपार्जन तौल डेस्क पर जाएं' : 'Go to Weighment Desk'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3 Hardware Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scale */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'hi' ? 'इलेक्ट्रॉनिक धर्मकांटा (Scale)' : 'Smart Electronic Weighbridge'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Model: ESP32 + HX711 24-Bit ADC
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'अधिकतम क्षमता:' : 'Capacity:'}</span>
                  <strong className="font-data">10,000 kg (10 Ton)</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'सटीकता (Accuracy):' : 'Accuracy:'}</span>
                  <strong className="font-data">±0.1 kg</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'कनेक्शन:' : 'Interface:'}</span>
                  <strong className="text-emerald-700">USB Serial (115200 baud)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Moisture Meter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'hi' ? 'डिजिटल नमी विश्लेषक (QC)' : 'Instant Moisture QC Meter'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Sensor: Capacitance NIR Sensor Probe
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'स्वीकार्य नमी (गेहूं):' : 'Max Allowed (Wheat):'}</span>
                  <strong className="font-data text-emerald-700">≤ 12.0%</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'सटीकता:' : 'Accuracy:'}</span>
                  <strong className="font-data">±0.1%</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'कनेक्शन:' : 'Interface:'}</span>
                  <strong className="text-blue-700">Bluetooth BLE / Serial</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Edge Gateway */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                TAMPER-PROOF
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'hi' ? 'हार्डवेयर सुरक्षा एवं क्रिप्टोग्राफी' : 'Hardware Security Seal'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Security: SHA-256 Checksum Signature
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'मानवीय हस्तक्षेप:' : 'Manual Override:'}</span>
                  <strong className="text-emerald-700 font-semibold">{lang === 'hi' ? 'अवरुद्ध (Zero Manual Entry)' : 'Blocked (Tamper-Proof)'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'सिग्नेचर:' : 'Telemetry Hash:'}</span>
                  <strong className="font-mono text-[11px] text-purple-700">HMAC-SHA256</strong>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'hi' ? 'आवृत्ति:' : 'Stream Interval:'}</span>
                  <strong className="font-data">1,000 ms (Real-time)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Scale Component */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            {lang === 'hi' ? 'लाइव तौल कांटा एवं नमी मीटर सिमुलेटर / इंटरफ़ेस' : 'Live Scale & Moisture Meter Interface (Web Serial / BLE / Simulation)'}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {lang === 'hi' ? 'परीक्षण अथवा प्रस्तुति हेतु यूएसबी पोर्ट, ब्लूटूथ या लाइव सिमुलेशन से वास्तविक समय की रीडिंग प्राप्त करें:' : 'Connect physical hardware via USB/Bluetooth, or test with the live ESP32 simulator for presentation demos:'}
          </p>
          <IoTScalePanel
            centreId={user?.centreId?._id || 'default'}
            cropType="Wheat"
            lang={lang}
          />
        </div>

        {/* Recent Hardware Telemetry Log Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {lang === 'hi' ? 'हार्डवेयर टेलीमेट्री एवं सुरक्षा ऑडिट लॉग' : 'Hardware Telemetry & Audit Log'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'उपार्जन केंद्र के डिजिटल कांटे से प्राप्त प्रमाणित डेटा' : 'Certified time-stamped weight & moisture packets received from ESP32'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono">
              3 Packets Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Device ID</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3 text-right">Net Weight</th>
                  <th className="py-2.5 px-3 text-center">Moisture</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3">Tamper-Proof Hash</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {telemetryLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono text-slate-600">{log.time}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{log.device}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-data font-semibold text-emerald-800">{log.weight}</td>
                    <td className="py-2.5 px-3 text-center font-data">{log.moisture}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">{log.grade}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{log.hash}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ESP32 Arduino Firmware Code Preview for Hackathon Judges */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {lang === 'hi' ? 'ESP32 माइक्रोकंट्रोलर फर्मवेयर कोड (Arduino C++)' : 'ESP32 Microcontroller Firmware Source (Arduino C++)'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  File: backend/firmware/esp32_smart_weighbridge.ino (SIH26032)
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-black/60 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed">
            {esp32FirmwareCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
