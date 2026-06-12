const LAST_UPDATED = "June 12, 2026";
const COMPANY_NAME = "Smart Age Solutions";
const APP_NAME = "SmartAppointment";
const CONTACT_EMAIL = "support@smartagesolutions.com";

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
    <div className="space-y-3 text-sm text-gray-700 leading-relaxed">{children}</div>
  </section>
);

const TOC_ITEMS = [
  { id: "acceptance",     label: "1. Acceptance of Terms" },
  { id: "service",        label: "2. Description of Service" },
  { id: "accounts",       label: "3. User Accounts & Registration" },
  { id: "bookings",       label: "4. Appointments & Bookings" },
  { id: "cancellations",  label: "5. Cancellations & Modifications" },
  { id: "data",           label: "6. Data Collection & Use" },
  { id: "rights",         label: "7. Your Data Rights" },
  { id: "communications", label: "8. Communications" },
  { id: "conduct",        label: "9. Acceptable Use" },
  { id: "ip",             label: "10. Intellectual Property" },
  { id: "liability",      label: "11. Limitation of Liability" },
  { id: "indemnification",label: "12. Indemnification" },
  { id: "changes",        label: "13. Changes to These Terms" },
  { id: "governing",      label: "14. Governing Law" },
  { id: "contact",        label: "15. Contact Us" },
];

const TermsPage = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">{COMPANY_NAME}</p>
        <h1 className="text-3xl font-bold text-gray-900">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-sm text-gray-600 max-w-2xl">
          Please read these Terms &amp; Conditions carefully before using the {APP_NAME} booking service. By booking an
          appointment or using this platform, you agree to be bound by these terms.
        </p>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-6 py-10 flex gap-10">
      {/* Table of contents — sticky sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Contents</p>
          <nav className="space-y-1">
            {TOC_ITEMS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="block text-xs text-gray-500 hover:text-indigo-600 py-0.5 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 space-y-10 min-w-0">

        <Section id="acceptance" title="1. Acceptance of Terms">
          <p>
            These Terms &amp; Conditions ("Terms") govern your access to and use of the {APP_NAME} appointment booking
            platform operated by <strong>{COMPANY_NAME}</strong> ("we", "us", or "our"). By accessing this service,
            completing a booking, or submitting your information through any booking form, you acknowledge that you have
            read, understood, and agree to be bound by these Terms.
          </p>
          <p>
            If you are booking on behalf of another individual, you represent that you have the authority to bind that
            individual to these Terms. If you do not agree, please do not use this service.
          </p>
          <p>
            These Terms apply to all users of the platform, including individuals booking appointments ("Clients") and
            businesses or practitioners providing services ("Service Providers").
          </p>
        </Section>

        <Section id="service" title="2. Description of Service">
          <p>
            {APP_NAME} is an online appointment scheduling platform that enables Service Providers to offer bookable
            time slots to their clients. As a Client, you may use this platform to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Browse available appointment times and services</li>
            <li>Submit booking requests and receive confirmations</li>
            <li>Manage, reschedule, or cancel existing appointments</li>
            <li>Receive appointment reminders and communications</li>
          </ul>
          <p>
            We act as a technology intermediary between Clients and Service Providers. {COMPANY_NAME} is not
            responsible for the quality, safety, or outcome of any services rendered by Service Providers. Any disputes
            regarding the underlying appointment services should be directed to the relevant Service Provider.
          </p>
          <p>
            We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or
            without notice, without liability to you.
          </p>
        </Section>

        <Section id="accounts" title="3. User Accounts & Registration">
          <p>
            Certain features of the platform may require you to provide personal information including your name, email
            address, and phone number. You agree to provide accurate, current, and complete information and to update
            it as necessary to keep it accurate.
          </p>
          <p>
            You are responsible for maintaining the confidentiality of any login credentials and for all activity that
            occurs under your account. You agree to notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>{" "}
            if you suspect any unauthorised use of your account.
          </p>
          <p>
            We reserve the right to terminate or suspend access to accounts that violate these Terms, engage in
            fraudulent activity, or are otherwise misused.
          </p>
        </Section>

        <Section id="bookings" title="4. Appointments & Bookings">
          <p>
            <strong>Booking confirmation.</strong> A booking is not confirmed until you receive a written confirmation
            via email or notification from the platform. Submission of a booking request does not guarantee
            availability.
          </p>
          <p>
            <strong>Accuracy of information.</strong> You are responsible for providing accurate contact details and
            any required information at the time of booking. Inaccurate information may result in a missed appointment
            for which we bear no liability.
          </p>
          <p>
            <strong>Punctuality.</strong> Please arrive on time for your appointment. Late arrivals may result in a
            shortened service or cancellation, at the sole discretion of the Service Provider.
          </p>
          <p>
            <strong>No-shows.</strong> Repeated no-shows without prior notice may result in your ability to make
            future bookings being restricted. Service Providers may implement their own no-show policies, which will
            be communicated to you at the time of booking.
          </p>
          <p>
            <strong>Special requirements.</strong> Any special accommodations or requirements must be communicated at
            the time of booking. We cannot guarantee that requirements submitted after confirmation can be
            accommodated.
          </p>
        </Section>

        <Section id="cancellations" title="5. Cancellations & Modifications">
          <p>
            <strong>Client cancellations.</strong> You may cancel or reschedule an appointment through the link
            provided in your confirmation email, or by contacting the Service Provider directly. We ask that you
            provide as much advance notice as possible — a minimum of 24 hours is strongly encouraged to avoid
            disruption to Service Providers.
          </p>
          <p>
            <strong>Cancellation policies.</strong> Individual Service Providers may enforce their own cancellation
            policies, including late cancellation or no-show fees. Any such policies will be made available to you
            prior to completing your booking. {COMPANY_NAME} is not responsible for fees charged by Service Providers
            under their own policies.
          </p>
          <p>
            <strong>Provider cancellations.</strong> Service Providers may cancel or reschedule appointments due to
            unforeseen circumstances. In such cases, you will be notified as soon as possible via the contact
            details you provided. We will make reasonable efforts to offer alternative appointment times.
          </p>
          <p>
            <strong>Refunds.</strong> Any refund obligations arise between you and the Service Provider. {COMPANY_NAME}{" "}
            does not process payments on behalf of Service Providers and has no liability for refund decisions.
          </p>
        </Section>

        <Section id="data" title="6. Data Collection & Use">
          <p>
            We collect and process personal data to provide the appointment booking service. This includes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Identity data</strong> — first name, last name, and optional title
            </li>
            <li>
              <strong>Contact data</strong> — email address and phone number
            </li>
            <li>
              <strong>Communication preferences</strong> — your preferred channels for appointment-related
              communications
            </li>
            <li>
              <strong>Booking data</strong> — appointment dates, times, services selected, and notes you provide
            </li>
            <li>
              <strong>Consent records</strong> — records of your agreement to these Terms and any marketing
              communications consent
            </li>
            <li>
              <strong>Technical data</strong> — IP address, browser type, and device information collected
              automatically when you use the platform
            </li>
          </ul>
          <p>
            <strong>Legal basis for processing.</strong> We process your personal data on the following legal
            bases under applicable data protection law:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Contract performance</strong> — processing necessary to fulfil your booking request and
              manage your appointment
            </li>
            <li>
              <strong>Legitimate interests</strong> — sending appointment reminders, improving our platform, and
              preventing fraud
            </li>
            <li>
              <strong>Consent</strong> — sending marketing communications, where you have opted in
            </li>
            <li>
              <strong>Legal obligation</strong> — retaining records as required by applicable law
            </li>
          </ul>
          <p>
            <strong>Data sharing.</strong> Your personal data is shared with the Service Provider with whom you are
            booking an appointment, as this is necessary to fulfil the service. We do not sell your personal data
            to third parties. We may share data with trusted third-party service providers (e.g., email delivery,
            hosting) under appropriate data processing agreements.
          </p>
          <p>
            <strong>Data retention.</strong> We retain your booking data for as long as necessary to provide the
            service and comply with legal obligations, typically no longer than 5 years after your last
            appointment, unless a longer period is required by law.
          </p>
        </Section>

        <Section id="rights" title="7. Your Data Rights">
          <p>
            Depending on your location, you may have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Right of access</strong> — request a copy of the personal data we hold about you
            </li>
            <li>
              <strong>Right to rectification</strong> — request correction of inaccurate or incomplete data
            </li>
            <li>
              <strong>Right to erasure</strong> — request deletion of your personal data, subject to our legal
              obligations to retain certain records
            </li>
            <li>
              <strong>Right to restriction</strong> — request that we limit the processing of your data in certain
              circumstances
            </li>
            <li>
              <strong>Right to data portability</strong> — receive your data in a structured, machine-readable
              format
            </li>
            <li>
              <strong>Right to object</strong> — object to processing based on legitimate interests, including
              direct marketing
            </li>
            <li>
              <strong>Right to withdraw consent</strong> — withdraw any consent you have given at any time,
              without affecting the lawfulness of processing before withdrawal
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>. We will
            respond within 30 days. You also have the right to lodge a complaint with your local data protection
            authority if you believe your rights have not been respected.
          </p>
          <p>
            <strong>California residents (CCPA).</strong> If you are a California resident, you have additional
            rights under the California Consumer Privacy Act, including the right to know what personal information
            is collected, the right to delete personal information, and the right to opt out of the sale of personal
            information (we do not sell personal information).
          </p>
        </Section>

        <Section id="communications" title="8. Communications">
          <p>
            By completing a booking, you consent to receive transactional communications related to your
            appointment, including confirmations, reminders, and follow-ups. These communications are necessary to
            provide the service and cannot be opted out of while an active booking exists.
          </p>
          <p>
            If you have opted in to marketing communications, we may send you information about other services,
            promotions, and updates. You may withdraw this consent at any time by clicking the "unsubscribe" link
            in any marketing email or by contacting us directly.
          </p>
          <p>
            We will only contact you via the communication channels you have selected and/or the email address
            provided during booking.
          </p>
        </Section>

        <Section id="conduct" title="9. Acceptable Use">
          <p>You agree not to use this platform to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Submit false, misleading, or fraudulent booking information</li>
            <li>Harass, abuse, or threaten Service Providers or other users</li>
            <li>Impersonate another person or entity</li>
            <li>
              Attempt to gain unauthorised access to any part of the platform or its underlying systems
            </li>
            <li>
              Use automated tools to scrape, crawl, or extract data from the platform without prior written
              consent
            </li>
            <li>Transmit any viruses, malware, or other harmful code</li>
            <li>Engage in any activity that disrupts or interferes with the proper functioning of the service</li>
            <li>Use the service for any unlawful purpose or in violation of applicable regulations</li>
          </ul>
          <p>
            Violations of this section may result in immediate termination of access and, where appropriate,
            referral to relevant authorities.
          </p>
        </Section>

        <Section id="ip" title="10. Intellectual Property">
          <p>
            All content on this platform, including but not limited to the {APP_NAME} name, logo, software,
            design, text, and graphics, is the exclusive property of {COMPANY_NAME} or its licensors and is
            protected by applicable intellectual property laws.
          </p>
          <p>
            You are granted a limited, non-exclusive, non-transferable licence to access and use the platform
            solely for the purpose of making and managing appointments. This licence does not permit you to
            copy, reproduce, modify, distribute, or create derivative works from any platform content.
          </p>
          <p>
            Any feedback, suggestions, or ideas you submit regarding the platform may be used by us freely without
            any obligation or compensation to you.
          </p>
        </Section>

        <Section id="liability" title="11. Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, {COMPANY_NAME} and its officers, directors,
            employees, and agents shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising out of or related to your use of the platform or the services booked through
            it, including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Loss of data, revenue, or profits</li>
            <li>Personal injury or property damage arising from a booked appointment</li>
            <li>Unauthorised access to or alteration of your data</li>
            <li>Any service interruptions or errors in the platform</li>
          </ul>
          <p>
            Our total aggregate liability to you for any claims arising from your use of the service shall not
            exceed the greater of (a) the amount you paid, if any, for the specific booking giving rise to the
            claim, or (b) one hundred US dollars (USD $100).
          </p>
          <p>
            Nothing in these Terms limits liability for fraud, gross negligence, wilful misconduct, or any other
            liability that cannot be excluded by law.
          </p>
        </Section>

        <Section id="indemnification" title="12. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and its affiliates, officers,
            directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, and
            expenses (including reasonable legal fees) arising out of or in any way connected with:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your use of the platform or any booked services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights, including privacy or intellectual property rights</li>
            <li>Any false or inaccurate information you provide through the platform</li>
          </ul>
        </Section>

        <Section id="changes" title="13. Changes to These Terms">
          <p>
            We reserve the right to update or modify these Terms at any time. When we make material changes, we
            will update the "Last updated" date at the top of this page and, where appropriate, notify you by
            email or through a notice on the platform.
          </p>
          <p>
            Your continued use of the platform after any changes constitutes your acceptance of the revised Terms.
            If you do not agree to the updated Terms, you should stop using the platform.
          </p>
          <p>
            We encourage you to review these Terms periodically to stay informed of any updates.
          </p>
        </Section>

        <Section id="governing" title="14. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising
            out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the
            competent courts in the jurisdiction where {COMPANY_NAME} is incorporated, unless otherwise required
            by applicable consumer protection law in your jurisdiction.
          </p>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
            limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in
            full force and effect.
          </p>
          <p>
            These Terms, together with any booking confirmation and applicable Service Provider policies,
            constitute the entire agreement between you and {COMPANY_NAME} with respect to your use of the
            platform.
          </p>
        </Section>

        <Section id="contact" title="15. Contact Us">
          <p>
            If you have any questions, concerns, or requests regarding these Terms or the handling of your
            personal data, please contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm space-y-1">
            <p><strong>{COMPANY_NAME}</strong></p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>Service: {APP_NAME} — Online Appointment Booking</p>
          </div>
          <p>
            We are committed to resolving any complaints promptly and fairly. If you are not satisfied with our
            response, you have the right to escalate your complaint to the relevant data protection authority in
            your jurisdiction.
          </p>
        </Section>

        {/* Footer note */}
        <div className="pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved. &middot;{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gray-600 underline">
            Contact
          </a>
        </div>

      </main>
    </div>
  </div>
);

export default TermsPage;
