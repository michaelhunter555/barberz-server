import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { App } from '../types';
export const isExpoPushToken = (pushToken: string) => Expo.isExpoPushToken(pushToken);
const expo = new Expo();
export const expoPushHandler = async (pushToken: string, messageData: ExpoPushMessage) => {
if(pushToken && isExpoPushToken(pushToken)){
    await expo.sendPushNotificationsAsync([
        {
            ...messageData,
            sound: {
                critical: true,
                name: 'alert.wav',
                volume: 1.0,
            }

        }
    ])
}
}
export default expo;