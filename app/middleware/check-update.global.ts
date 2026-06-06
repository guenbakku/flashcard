export default defineNuxtRouteMiddleware(clientOnly((_to, _from) => {
  // Run update check on a 20% sample rate of route changes to reduce overhead
  if (Math.random() <= 0.2) {
    console.log('Running update checking...');
    const { checkUpdate } = useUpdateChecking();
    checkUpdate();
  }
}));
