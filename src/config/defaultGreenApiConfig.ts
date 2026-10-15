/**
 * Permanent Project Default Configuration for Green API & WhatsApp Automation
 * Guarantees that any computer, browser, or GitHub Pages instance has active credentials
 * without requiring the user to re-enter anything.
 */

export interface PermanentGreenApiConfig {
  instanceId: string;
  apiToken: string;
  apiUrl: string;
  targetGroupChatId: string;
  targetGroupName: string;
  webhookUrl: string;
  isConfigured: boolean;
}

export const PERMANENT_GREEN_API_CONFIG: PermanentGreenApiConfig = {
  instanceId: '710522729304',
  apiToken: '932ed5d279b54eb3b53e3f5cd1558676f7759b1b49424b97b6',
  apiUrl: 'https://7105.api.greenapi.com',
  targetGroupChatId: '120363046746721856@g.us',
  targetGroupName: 'Daily Facility Inspection',
  webhookUrl: '',
  isConfigured: true,
};
