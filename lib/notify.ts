import { getGeoForIp } from './geo-cache';

export async function sendAdminAlert({
  ip,
  status,
  userAgent,
  path = '/api/admin/visitors',
}: {
  ip: string;
  status: 'SUCCESS' | 'FAILED';
  userAgent?: string;
  path?: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const geo = await getGeoForIp(ip);
    const locationStr = geo 
      ? `${geo.city}, ${geo.region}, ${geo.country_name} (${geo.org})`
      : 'Unknown Location';

    const color = status === 'SUCCESS' ? 0x00ff00 : 0xff0000;
    const title = status === 'SUCCESS' ? '🚨 Admin Dashboard Accessed' : '⚠️ Failed Admin Login Attempt';

    const embed = {
      title,
      color,
      fields: [
        { name: 'IP Address', value: ip, inline: true },
        { name: 'Status', value: status, inline: true },
        { name: 'Location', value: locationStr, inline: false },
        { name: 'Path', value: path, inline: true },
        { name: 'Time', value: new Date().toISOString(), inline: true },
      ],
      footer: { text: userAgent ? `User Agent: ${userAgent}` : 'goonsite-admin-monitor' }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error('Failed to send discord alert', error);
  }
}
