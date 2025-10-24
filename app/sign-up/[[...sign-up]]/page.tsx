import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-text">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Join NavIN and start building your professional network
          </p>
        </div>
        <div className="mt-8">
          <SignUp
            routing="path"
            path="/sign-up"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-white',
                card: 'bg-card border border-border',
                headerTitle: 'text-text',
                headerSubtitle: 'text-text-muted',
                socialButtonsBlockButton: 'border border-border hover:bg-secondary',
                socialButtonsBlockButtonText: 'text-text',
                formFieldLabel: 'text-text',
                formFieldInput: 'bg-background border border-border text-text',
                footerActionText: 'text-text-muted',
                footerActionLink: 'text-primary hover:text-primary/80'
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}