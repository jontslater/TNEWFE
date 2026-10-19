import LegalPageLayout from './LegalPageLayout';

export default function RefundPage() {
  return (
    <LegalPageLayout title="Refund Policy">
      <p className="mb-4 text-sm text-gray-400">Last updated: October 19, 2026</p>
      <p className="mb-4">
        [BUSINESS NAME] sells digital goods for The Never Ending War, including token packs and founder
        cosmetics. Because items are delivered immediately, purchases are generally non-refundable once
        credited to your account.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Eligible refunds</h2>
      <p className="mb-4">
        We may issue refunds at our discretion for duplicate charges, unauthorized purchases, or technical
        failures that prevented delivery. Contact [SUPPORT EMAIL] within 14 days of the charge with your
        receipt and account details.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Chargebacks</h2>
      <p className="mb-4">
        Filing a chargeback without contacting support may result in suspension of your account and reversal of
        virtual items granted by the purchase.
      </p>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Jurisdiction</h2>
      <p>This policy is governed by the laws of [JURISDICTION].</p>
    </LegalPageLayout>
  );
}
