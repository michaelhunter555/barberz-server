export const generateOrderNumber = (userId: string) => {
    const now = Date.now().toString();
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    return `ORD-${userId.slice(-4)}-${now.slice(-6)}-${random}`;
  };
