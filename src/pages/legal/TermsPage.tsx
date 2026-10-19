import LegalPageLayout from './LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p className="mb-4 text-sm text-gray-400">Last updated: October 19, 2026</p>
      <p className="mb-4">
        These Terms of Service (&quot;Terms&quot;) govern your use of The Never Ending War (&quot;the Game&quot;)
        operated by [BUSINESS NAME] (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Acceptance</h2>
      <p className="mb-4">
        By accessing or playing the Game, linking a Twitch account, or making a purchase, you agree to these
        Terms. If you do not agree, do not use the Game.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Accounts</h2>
      <p className="mb-4">
        You are responsible for activity on your account. You must provide accurate information and keep your
        credentials secure.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Virtual items</h2>
      <p className="mb-4">
        Tokens, cosmetics, and in-game currency have no real-world cash value, are non-transferable except as
        expressly permitted in-game, and may be modified or discontinued at our discretion.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Conduct</h2>
      <p className="mb-4">
        You may not cheat, exploit bugs, harass others, or attempt to disrupt the Game or its services.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Governing law</h2>
      <p className="mb-4">
        These Terms are governed by the laws of [JURISDICTION], without regard to conflict-of-law principles.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Contact</h2>
      <p>
        Questions about these Terms: [SUPPORT EMAIL]
      </p>
    </LegalPageLayout>
  );
}
