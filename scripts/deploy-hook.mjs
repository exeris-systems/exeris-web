// Starts a Workers build through a Worker's deploy hook. The hook URL is a credential: it is read
// from the environment and neither it nor any part of the hook's answer is printed.

/**
 * Posts to the deploy hook in the environment variable `name` (`what` names the Worker in
 * messages) and says whether a build started or one was already queued.
 */
export async function startBuild(name, what, env = process.env) {
  const hook = env[name];
  if (!hook) throw new Error(`${name} is not set; it is the deploy hook URL of the ${what} Worker`);
  const res = await fetch(hook, { method: 'POST' });
  if (!res.ok) throw new Error(`the deploy hook of ${what} answered ${res.status}`);
  const { result } = await res.json();
  return result?.already_exists ? 'a build was already queued' : 'build started';
}
