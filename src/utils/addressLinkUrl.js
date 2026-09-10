const ADDRESS_LINK_BASE_URL = 'https://kjrnfryut784hvrubv.vercel.app/';

export function addressLinkUrl(response) {
  const data = response?.data ?? response ?? {};
  const returnedUrl = data.public_link || data.url || data.link || data.publicUrl;
  const code = data.code || (returnedUrl
    ? new URL(returnedUrl, ADDRESS_LINK_BASE_URL).pathname.split('/').filter(Boolean).pop()
    : '');
  if (!code) throw new Error('Address link code not returned by server.');
  return `${ADDRESS_LINK_BASE_URL}address-form/${encodeURIComponent(code)}`;
}
