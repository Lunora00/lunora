export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex justify-center py-20 px-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg p-10">
        
        <h1 className="text-3xl font-extrabold text-[#1B3358] mb-2">
          Lunora AI — Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 10, 2026</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          
          <section>
            <p className="italic text-gray-600">
              Your night study space should be private, calm, and respected. 
              This Privacy Policy explains how Lunora AI collects, uses, and protects your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">1. Information We Collect</h2>
            <div className="space-y-3">
              <p><strong>1.1 Information You Provide:</strong> We collect your name, email address, profile photo (owl avatar), and any content you upload (documents, notes, or links) to generate study materials.</p>
              <p><strong>1.2 Information Collected Automatically:</strong> We collect device information, IP addresses, and usage behavior (such as session length and learning progress) to improve your experience.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">2. How We Use Your Data</h2>
            <p>
              Your data is used to generate personalized quizzes, track your study streaks, 
              manage leaderboards, and provide customer support. <strong>We do not sell your personal information or study content to third parties.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">3. AI Processing & Training</h2>
            <p>
              Lunora AI uses advanced AI models to process your content. 
              Your uploaded study materials are used <strong>only</strong> to generate your specific 
              learning tools (flashcards, summaries, etc.). Your data is <strong>not</strong> used 
              to train public, foundation AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">4. Cookies & Tracking</h2>
            <p>
              We use essential cookies to keep you logged in and remember your preferences. 
              You can manage cookie settings through your browser, though some features may 
              not function correctly without them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">5. Data Sharing</h2>
            <p>
              We only share data with essential service providers, such as:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Authentication providers (Google Sign-In)</li>
              <li>Secure hosting and database services</li>
              <li>Payment processors (for premium plans)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">6. Your Rights & Deletion</h2>
            <p>
              You have the right to access, correct, or download your data. You may delete 
              your account at any time through the settings page, which will remove your 
              personal data from our active databases.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">7. Children's Privacy</h2>
            <p>
              Lunora AI is not intended for users under the age of 13. If we discover 
              we have inadvertently collected data from a child under 13, we will 
              delete it immediately.
            </p>
          </section>

          <section className="border-t pt-6">
            <h2 className="text-lg font-bold text-[#1B3358] mb-2">8. Contact Us</h2>
            <p>
              For privacy-related inquiries or to exercise your data rights, please contact:
              <br />
              <strong>Email:</strong> lunoraaiplus@gmail.com
              <br />
              <strong>Company:</strong> Lunora AI Technologies
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}