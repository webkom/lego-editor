const protocolRe = /^(?:f|ht)tps?:\/\//;
const hostnameRe = /([a-zA-Z]\.?)+\.([a-zA-Z]){2,}/;

const urlRe = new RegExp(protocolRe.source + hostnameRe.source);
const mailRe = new RegExp('^mailto:([a-zA-Z](\\.|\\+)?)+@' + hostnameRe.source);
const onlyHostnameRe = new RegExp('^' + hostnameRe.source);

const isUrl = (url: string): boolean => urlRe.test(url) || mailRe.test(url);

export const prependHttps = (hostname: string): string => {
  if (onlyHostnameRe.test(hostname) && !mailRe.test(hostname)) {
    return 'https://' + hostname;
  }
  return hostname;
};

export default isUrl;
