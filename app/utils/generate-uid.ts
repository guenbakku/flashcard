const generateUid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `uid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export default generateUid;
