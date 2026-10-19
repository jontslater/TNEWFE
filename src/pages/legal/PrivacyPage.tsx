import LegalPageLayout from './LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="mb-4 text-sm text-gray-400">Last updated: October 19, 2026</p>
      <p className="mb-4">
        [BUSINESS NAME] (&quot;we&quot;) operates The Never Ending War. This Privacy Policy describes how we
        collect, use, and share information when you use the Game.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Information we collect</h2>
      <p className="mb-4">
        We collect account identifiers from Twitch (or other linked providers), gameplay progress, purchase
        records, and technical logs needed to operate and secure the service.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">How we use information</h2>
      <p className="mb-4">
        We use data to provide gameplay, process payments, prevent abuse, improve the Game, and communicate
        service-related notices.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Sharing</h2>
      <p className="mb-4">
        We share data with infrastructure and payment processors as needed to run the Game. We do not sell
        personal information.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Your rights</h2>
      <p className="mb-4">
        Depending on your location, you may have rights to access, correct, or delete personal data. Contact us
        at [SUPPORT EMAIL].
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Governing law</h2>
      <p>[JURISDICTION]</p>
    </LegalPageLayout>
  );
}
