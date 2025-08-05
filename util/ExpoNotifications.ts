import { Expo } from 'expo-server-sdk';
export const isExpoPushToken = (pushToken: string) =>Expo.isExpoPushToken(pushToken);
const expo = new Expo();
export default expo;