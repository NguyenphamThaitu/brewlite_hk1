import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 – Không tìm thấy trang | BrewLite',
    description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
};

export default function NotFound() {
    return (
        <div className="not-found-wrapper">
            {/* Decorative blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />

            <div className="not-found-content">
                {/* Cup icon */}
                <div className="cup-icon">☕</div>

                {/* 404 number */}
                <div className="error-code">404</div>

                {/* Divider */}
                <div className="divider" />

                {/* Message */}
                <h1 className="error-title">Không tìm thấy trang</h1>
                <p className="error-desc">
                    Trang bạn đang tìm kiếm không tồn tại,<br />
                    đã bị di chuyển hoặc địa chỉ URL không đúng.
                </p>

                {/* CTA */}
                <Link href="/" className="back-btn">
                    ← Về trang chủ
                </Link>
            </div>

            <style>{`
                .not-found-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 70vh;
                    overflow: hidden;
                    padding: 2rem;
                }

                /* Background blobs */
                .blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.12;
                    pointer-events: none;
                }
                .blob-1 {
                    width: 400px;
                    height: 400px;
                    background: #0f3a52;
                    top: -80px;
                    left: -100px;
                    animation: float 8s ease-in-out infinite;
                }
                .blob-2 {
                    width: 300px;
                    height: 300px;
                    background: #c4956a;
                    bottom: -60px;
                    right: -80px;
                    animation: float 10s ease-in-out infinite reverse;
                }

                .not-found-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 1rem;
                    background: rgba(255,255,255,0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(196,149,106,0.2);
                    border-radius: 24px;
                    padding: 3rem 4rem;
                    box-shadow: 0 20px 60px rgba(15,58,82,0.1);
                    animation: fadeUp 0.6s ease both;
                }

                .cup-icon {
                    font-size: 3.5rem;
                    animation: bounce 2s ease-in-out infinite;
                    line-height: 1;
                }

                .error-code {
                    font-size: clamp(5rem, 15vw, 9rem);
                    font-weight: 900;
                    line-height: 1;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #0f3a52 0%, #c4956a 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .divider {
                    width: 60px;
                    height: 3px;
                    background: linear-gradient(90deg, #0f3a52, #c4956a);
                    border-radius: 99px;
                    margin: 0.25rem 0;
                }

                .error-title {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #0f3a52;
                    margin: 0;
                }

                .error-desc {
                    font-size: 0.95rem;
                    color: #637585;
                    line-height: 1.7;
                    margin: 0;
                }

                .back-btn {
                    margin-top: 0.5rem;
                    display: inline-block;
                    padding: 0.75rem 2rem;
                    background: linear-gradient(135deg, #0f3a52, #1a5a7a);
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border-radius: 99px;
                    text-decoration: none;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 16px rgba(15,58,82,0.25);
                }
                .back-btn:hover {
                    background: linear-gradient(135deg, #c4956a, #a97b52);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(196,149,106,0.35);
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
