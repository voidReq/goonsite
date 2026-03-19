import { createHmac, randomBytes } from 'crypto';
import { getGeoForIp } from './geo-cache';

/**
 * HMAC secret for signing one-click approve/deny tokens.
 * Priority: HMAC_SECRET env var → auto-generated per process (logged once on startup).
 */
let hmacSecret: string;
if (process.env.HMAC_SECRET) {
  hmacSecret = process.env.HMAC_SECRET;
} else {
  hmacSecret = randomBytes(32).toString('hex');
  console.warn(
    `[notify] No HMAC_SECRET set — generated ephemeral key: ${hmacSecret.slice(0, 8)}…  (tokens will invalidate on restart)`
  );
}

/**
 * Generate an HMAC-SHA256 signature for one-click message actions.
 */
export function signAction(id: string, action: string): string {
  return createHmac('sha256', hmacSecret).update(`${id}:${action}`).digest('hex');
}

/**
 * Verify an HMAC-SHA256 signature for one-click message actions.
 */
export function verifyAction(id: string, action: string, token: string): boolean {
  const expected = signAction(id, action);
  return expected === token;
}

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

/**
 * Send a Discord webhook notification when a new message is submitted,
 * with one-click approve/deny links using signed tokens.
 */
export async function sendMessageAlert({
  id,
  text,
  author,
  ip,
}: {
  id: string;
  text: string;
  author: string;
  ip: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const approveToken = signAction(id, 'approve');
  const denyToken = signAction(id, 'deny');

  const approveUrl = `${baseUrl}/api/admin/messages/quick?id=${id}&action=approve&token=${approveToken}`;
  const denyUrl = `${baseUrl}/api/admin/messages/quick?id=${id}&action=deny&token=${denyToken}`;

  try {
    const geo = await getGeoForIp(ip);
    const locationStr = geo
      ? `${geo.city}, ${geo.region}, ${geo.country_name}`
      : 'Unknown';

    const embed = {
      title: '💬 New Message Submitted',
      color: 0x7c3aed,
      fields: [
        { name: 'Author', value: author, inline: true },
        { name: 'IP', value: ip, inline: true },
        { name: 'Location', value: locationStr, inline: true },
        { name: 'Message', value: text.length > 1000 ? text.slice(0, 1000) + '...' : text, inline: false },
        { name: 'Quick Actions', value: `[✅ Approve](${approveUrl}) · [❌ Deny](${denyUrl})`, inline: false },
      ],
      footer: { text: `ID: ${id}` },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error('Failed to send message alert', error);
  }
}
