/**
 * Factory: createAuthCard
 *
 * Builds the shared auth page shell — a centered card with a title and optional
 * footer link — used by LoginComponent and RegisterComponent.
 *
 * @param {Object} options
 * @param {string} options.id        - Value for the section's `id` attribute.
 * @param {string} options.ariaLabel - Accessible label for the section.
 * @param {string} options.title     - Heading text rendered inside the card.
 * @param {string} options.footerHtml- Raw HTML string for the footer paragraph
 *                                    (e.g. a "Sign up" or "Sign in" link).
 * @returns {{ wrapper: HTMLElement, container: HTMLElement }}
 *   `wrapper`   — the outermost `<section class="auth-card">` element to mount.
 *   `container` — the same element; kept symmetric with createPageLayout's API
 *                 so callers can append form content to `container`.
 */
export const createAuthCard = ({ id, ariaLabel, title, footerHtml }) => {
  const wrapper = document.createElement('section');
  wrapper.className = 'auth-card';
  wrapper.id = id;
  wrapper.setAttribute('aria-label', ariaLabel);

  const heading = document.createElement('h1');
  heading.className = 'auth-card__title';
  heading.textContent = title;
  wrapper.appendChild(heading);

  if (footerHtml) {
    const footer = document.createElement('p');
    footer.className = 'auth-card__footer';
    footer.innerHTML = footerHtml;
    // Defer appending so callers can insert the form between heading and footer
    wrapper._footer = footer;
  }

  /**
   * Appends the footer (if any) to the wrapper.
   * Must be called after the form content has been appended.
   */
  wrapper.appendFooter = () => {
    if (wrapper._footer) {
      wrapper.appendChild(wrapper._footer);
      delete wrapper._footer;
    }
  };

  return { wrapper, container: wrapper };
};
