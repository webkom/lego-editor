/**
 * Check if a link url is an internal link or an external one by comparing the host with the current host.
 * [protocol]//[hostname]:[port]/[pathname] - [host] = [hostname]:[port]
 *
 * @param linkUrlString The URL of the link
 * @returns boolean
 */
const isInternalLink = (linkUrlString: string): boolean => {
  try {
    const linkUrl = new URL(linkUrlString);
    const currentUrl = new URL(window.location.href);
    return linkUrl.host === currentUrl.host;
  } catch (e) {
    // Handle invalid URLs as if they are not internal
    return false;
  }
};

export default isInternalLink;
