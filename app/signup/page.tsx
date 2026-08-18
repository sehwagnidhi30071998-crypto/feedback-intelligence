import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Create account
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sign up to use Feedback Intelligence.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <SignupForm />
      </div>
    </div>
  );
}