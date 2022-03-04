
export async function getPushSubscription() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();

    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      return sub ?? undefined;
    }
  } catch (e) {}
}

export async function cancelPushSubscription(reg?: PushSubscription) {
  if (!reg) {
    reg = await getPushSubscription();

    if (!reg) {
      return;
    }
  }
  return reg.unsubscribe();
}
