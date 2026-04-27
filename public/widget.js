(function() {
  // Find the script tag that loaded this script
  const scripts = document.getElementsByTagName('script');
  let currentScript = null;
  for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.includes('widget.js')) {
      currentScript = scripts[i];
      break;
    }
  }

  if (!currentScript) return;

  const slug = currentScript.getAttribute('data-booking-page-slug');
  const pageId = currentScript.getAttribute('data-booking-page-id');
  const scriptSrc = currentScript.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.indexOf('/widget.js'));

  if (!slug) {
    console.error('SmartAppointment Widget: data-booking-page-slug is missing');
    return;
  }

  // Create a container for the iframe
  const container = document.createElement('div');
  container.className = 'smart-appointment-widget-container';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.minHeight = '600px';

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/book/${slug}?embedded=true${pageId ? `&page_id=${pageId}` : ''}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.minHeight = '600px';

  container.appendChild(iframe);

  // Insert the container right after the script tag
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
})();
