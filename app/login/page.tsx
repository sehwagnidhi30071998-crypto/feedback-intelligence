import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Access your shared feedback workspace.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <LoginForm />
      </div>
    </div>
  );
}