// =============================================================================
// Login Form - Professional Hospital Dashboard Authentication
// Split-screen design with branding and clean form
// =============================================================================

import './LoginForm.css';
import { useState } from 'react';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import {
  Stethoscope,
  Database,
  Shield,
  Zap,
  ArrowRight,
  KeyRound,
  HelpCircle,
} from 'lucide-react';

interface LoginFormProps {
  onConnect: (sessionId: string) => Promise<boolean>;
  error?: Error | null;
  isConnecting: boolean;
}

export function LoginForm({ onConnect, error, isConnecting }: LoginFormProps) {
  const [sessionId, setSessionId] = useState(import.meta.env.BMS_SESSION_ID || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sessionId.trim();
    if (!trimmed) return;
    await onConnect(trimmed);
  };

  return (
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          {/* Logo & Title */}
          <div className="branding-header">
            <div className="branding-icon">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="branding-title">ระบบฝากครรภ์และการคลอด</h1>
              <p className="branding-subtitle">Pregnancy & Labor Dashboard</p>
            </div>
          </div>

          {/* Tagline */}
          <div className="branding-tagline">
            <h2>
              ติดตามข้อมูลฝากครรภ์
              <br />
              <span className="text-gradient">การคลอดและทารกแรกเกิด</span>
            </h2>
          </div>

          {/* Features */}
          <div className="branding-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h3>เชื่อมต่อ HOSxP</h3>
                <p>ข้อมูล ANC, การคลอด และทารกแรกเกิดแบบ Real-time</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3>KPI ตามเกณฑ์กระทรวง</h3>
                <p>ตัวชี้วัด MOPH/WHO พร้อมรายละเอียดรายบุคคล</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3>ปลอดภัยด้วย BMS Session</h3>
                <p>เข้าถึงข้อมูลอ่านอย่างเดียวผ่านระบบยืนยันตัวตน</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="branding-footer">
            <span>Powered by BMS Session API</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="branding-glow branding-glow-1" />
        <div className="branding-glow branding-glow-2" />
        <div className="branding-pattern" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="login-form-icon">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2>เชื่อมต่อเซสชัน</h2>
            <p>ป้อนรหัสเซสชัน BMS เพื่อเริ่มใช้งาน</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="session-id" className="form-label">
                รหัสเซสชัน BMS
              </label>
              <div className="input-wrapper">
                <input
                  id="session-id"
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="02FA45D1-91EF-4D6E-B341-ED1436343807"
                  disabled={isConnecting}
                  autoComplete="off"
                  className="form-input"
                />
              </div>
              <p className="form-hint">
                รหัสเซสชันอยู่ใน URL ของระบบ HOSxP หรือติดต่อผู้ดูแลระบบ
              </p>
            </div>

            {error && (
              <div className="error-alert">
                <div className="error-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="error-content">
                  <p className="error-title">การเชื่อมต่อล้มเหลว</p>
                  <p className="error-message">{error.message}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting || !sessionId.trim()}
              className="submit-button"
            >
              {isConnecting ? (
                <span className="submit-loading">
                  <LoadingSpinner size="sm" />
                  <span>กำลังเชื่อมต่อ...</span>
                </span>
              ) : (
                <span className="submit-content">
                  <span>เชื่อมต่อ</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <div className="login-help">
            <HelpCircle className="h-4 w-4" />
            <span>
              ต้องการความช่วยเหลือ?{' '}
              <a
                href="https://hosxp.net"
                target="_blank"
                rel="noopener noreferrer"
                className="help-link"
              >
                ติดต่อฝ่ายสนับสนุน
              </a>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
