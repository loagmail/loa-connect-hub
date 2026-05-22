import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { verifyInviteToken } from "@/lib/services/invite-token"
import { userRepository } from "@/lib/repositories/factory"
import Link from "next/link"

export default async function InvitePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const result = verifyInviteToken(token)

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 bg-white max-w-md text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Invalid or Expired Invite</h1>
          <p className="text-sm text-slate-500 mt-2">This invite link is no longer valid. Please contact the meeting organizer for a new invitation.</p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-gold-600 hover:text-gold-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const { meetingId, userId } = result
  const user = await userRepository.findById(userId)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 bg-white max-w-md text-center">
          <h1 className="text-lg font-bold text-slate-900">User Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">The user associated with this invite no longer exists.</p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-gold-600 hover:text-gold-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const session = await auth()
  const isLoggedIn = !!session?.user

  if (isLoggedIn) {
    const loggedInUserId = (session.user as any).id
    if (loggedInUserId === userId) {
      redirect(`/faculty/meetings/${meetingId}`)
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card p-8 bg-white max-w-md text-center">
            <h1 className="text-lg font-bold text-slate-900">Not Your Invite</h1>
            <p className="text-sm text-slate-500 mt-2">This invite was sent to a different user. Please sign in with the correct account.</p>
            <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-gold-600 hover:text-gold-700">
              Sign in with a different account
            </Link>
          </div>
        </div>
      )
    }
  }

  if (user.hasLoggedInBefore) {
    redirect(`/login?callbackUrl=/invites/${token}`)
  } else {
    redirect(`/activate?callbackUrl=/invites/${token}`)
  }
}
