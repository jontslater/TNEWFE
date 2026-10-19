import { useNavigate } from 'react-router-dom';

export default function SiteFooter() {
  const navigate = useNavigate();
  return (
    <footer className="bg-gray-900 py-8 border-t border-gray-800">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm space-y-2">
        <p>© 2025 The Never Ending War. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button type="button" onClick={() => navigate('/terms')} className="hover:text-gray-300">
            Terms of Service
          </button>
          <button type="button" onClick={() => navigate('/privacy')} className="hover:text-gray-300">
            Privacy Policy
          </button>
          <button type="button" onClick={() => navigate('/refund')} className="hover:text-gray-300">
            Refund Policy
          </button>
        </div>
      </div>
    </footer>
  );
}
