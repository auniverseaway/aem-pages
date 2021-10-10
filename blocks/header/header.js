import { loadScript, debug, getMetadata, cleanVariations, setDomain } from '../../scripts.js';
import { getEnv } from '../../utils/env.js';

const BRAND_IMG = '<img loading="lazy" alt="Adobe" src="/blocks/header/adobe-logo.svg">';
const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false">
<path d="M14 2A8 8 0 0 0 7.4 14.5L2.4 19.4a1.5 1.5 0 0 0 2.1 2.1L9.5 16.6A8 8 0 1 0 14 2Zm0 14.1A6.1 6.1 0 1 1 20.1 10 6.1 6.1 0 0 1 14 16.1Z"></path>
</svg>`;
const IS_OPEN = 'is-Open';

/**
 * Create an element with ID, class, children, and attributes
 * @param {Object} props to create the element
 * @returns {HTMLElement} the element created
 */
export function createEl({
  tag, className, id, html, attributes,
}) {
  const el = document.createElement(tag);
  if (id) { el.id = id; }
  if (className) { el.className = className; }
  if (html) {
    if (html instanceof HTMLElement) {
      el.append(html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      el.setAttribute(key, attributes[key]);
    });
  }
  return el;
}

class Gnav {
  constructor(body, el) {
    console.log(body, el);
    this.el = el;
    this.body = body;
    this.env = getEnv();
    this.desktop = window.matchMedia('(min-width: 1200px)');
  }

  init = () => {
    this.state = {};
    this.curtain = createEl({ tag: 'div', className: 'gnav-curtain' });
    const nav = createEl({ tag: 'nav', className: 'gnav' });

    const mobileToggle = this.decorateToggle(nav);
    nav.append(mobileToggle);

    const brand = this.decorateBrand();
    if (brand) {
      nav.append(brand);
    }

    const mainNav = this.decorateMainNav();
    if (mainNav) {
      nav.append(mainNav);
    }

    const search = this.decorateSearch();
    if (search) {
      nav.append(search);
    }

    const profile = this.decorateProfile();
    if (profile) {
      nav.append(profile);
    }

    const logo = this.decorateLogo();
    if (logo) {
      nav.append(logo);
    }

    const wrapper = createEl({ tag: 'div', className: 'gnav-wrapper', html: nav });
    this.el.append(this.curtain, wrapper);
  }

  decorateToggle = (nav) => {
    const toggle = createEl({
      tag: 'button',
      className: 'gnav-toggle',
      attributes: {
        'aria-label': 'Navigation menu',
        'aria-expanded': false,
      },
    });
    const onMediaChange = (e) => {
      if (e.matches) {
        nav.classList.remove(IS_OPEN);
        this.curtain.classList.remove(IS_OPEN);
      }
    };
    toggle.addEventListener('click', async () => {
      if (nav.classList.contains(IS_OPEN)) {
        nav.classList.remove(IS_OPEN);
        this.curtain.classList.remove(IS_OPEN);
        this.desktop.removeEventListener('change', onMediaChange);
      } else {
        nav.classList.add(IS_OPEN);
        this.desktop.addEventListener('change', onMediaChange);
        this.curtain.classList.add(IS_OPEN);
        this.loadSearch();
      }
    });
    return toggle;
  }

  decorateBrand = () => {
    const brandBlock = this.body.querySelector('.gnav-brand');
    if (!brandBlock) return null;
    const brand = brandBlock.querySelector('a');
    brand.classList.add('gnav-brand');
    if (brandBlock.classList.contains('with-logo')) {
      brand.insertAdjacentHTML('afterbegin', BRAND_IMG);
    }
    return brand;
  }

  decorateLogo = () => {
    const logo = this.body.querySelector('.adobe-logo a');
    logo.classList.add('gnav-logo');
    logo.setAttribute('aria-label', logo.textContent);
    logo.textContent = '';
    logo.insertAdjacentHTML('afterbegin', BRAND_IMG);
    return logo;
  }

  decorateMainNav = () => {
    const mainLinks = this.body.querySelectorAll('h2 > a');
    if (mainLinks.length > 0) {
      return this.buildMainNav(mainLinks);
    }
    return null;
  }

  buildMainNav = (navLinks) => {
    const mainNav = createEl({ tag: 'div', className: 'gnav-mainnav' });
    navLinks.forEach((navLink, idx) => {
      const navItem = createEl({ tag: 'div', className: 'gnav-navitem' });

      const menu = navLink.closest('div');
      menu.querySelector('h2').remove();
      navItem.appendChild(navLink);

      if (menu.childElementCount > 0) {
        const id = `navmenu-${idx}`;
        menu.id = id;
        navItem.classList.add('has-Menu');
        navLink.setAttribute('role', 'button');
        navLink.setAttribute('aria-expanded', false);
        navLink.setAttribute('aria-controls', id);

        const decoratedMenu = this.decorateMenu(navItem, navLink, menu);
        navItem.appendChild(decoratedMenu);
      }
      mainNav.appendChild(navItem);
    });
    return mainNav;
  }

  decorateMenu = (navItem, navLink, menu) => {
    menu.className = 'gnav-navitem-menu';
    const childCount = menu.childElementCount;
    if (childCount === 1) {
      menu.classList.add('small-Variant');
    } else if (childCount === 2) {
      menu.classList.add('medium-Variant');
    } else if (childCount >= 3) {
      menu.classList.add('large-Variant');
      const container = createEl({ tag: 'div', className: 'gnav-menu-container' });
      container.append(...Array.from(menu.children));
      menu.append(container);
    }
    navLink.addEventListener('focus', () => {
      window.addEventListener('keydown', this.toggleOnSpace);
    });
    navLink.addEventListener('blur', () => {
      window.removeEventListener('keydown', this.toggleOnSpace);
    });
    navLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu(navItem);
    });
    return menu;
  }

  decorateSearch = () => {
    const searchBlock = this.body.querySelector('.search');
    if (searchBlock) {
      const label = searchBlock.querySelector('p').textContent;
      const advancedLink = searchBlock.querySelector('a');
      const searchEl = createEl({ tag: 'div', className: 'gnav-search' });
      const searchBar = this.decorateSearchBar(label, advancedLink);
      const searchButton = createEl({
        tag: 'button',
        className: 'gnav-search-button',
        html: SEARCH_ICON,
        attributes: {
          'aria-label': label,
          'aria-expanded': false,
          'aria-controls': 'gnav-search-bar',
        },
      });
      searchButton.addEventListener('click', () => {
        this.loadSearch(searchEl);
        this.toggleMenu(searchEl);
      });
      searchEl.append(searchButton, searchBar);
      return searchEl;
    }
    return null;
  }

  decorateSearchBar = (label, advancedLink) => {
    const searchBar = createEl({ tag: 'aside', id: 'gnav-search-bar', className: 'gnav-search-bar' });
    const searchField = createEl({ tag: 'div', className: 'gnav-search-field', html: SEARCH_ICON });
    const searchInput = createEl({ tag: 'input', className: 'gnav-search-input', attributes: { placeholder: label } });
    const searchResults = createEl({ tag: 'div', className: 'gnav-search-results' });

    searchInput.addEventListener('input', (e) => {
      this.onSearchInput(e.target.value, searchResults, advancedLink);
    });

    searchField.append(searchInput, advancedLink);
    searchBar.append(searchField, searchResults);
    return searchBar;
  }

  loadSearch = async () => {
    if (this.onSearchInput) return;
    const gnavSearch = await import('./gnav-search.js');
    this.onSearchInput = gnavSearch.default;
  }

  decorateProfile = () => {
    const blockEl = this.body.querySelector('.profile');
    if (!blockEl) return null;
    const profileEl = createEl({ tag: 'div', className: 'gnav-profile' });

    window.adobeid = {
      client_id: 'bizweb',
      scope: 'AdobeID,openid,gnav',
      locale: 'en_US',
      autoValidateToken: true,
      environment: this.env.ims,
      useLocalStorage: false,
      onReady: () => { this.imsReady(blockEl, profileEl); },
    };
    loadScript('https://auth.services.adobe.com/imslib/imslib.min.js');

    return profileEl;
  }

  imsReady = async (blockEl, profileEl) => {
    const accessToken = window.adobeIMS.getAccessToken();
    if (accessToken) {
      const ioResp = await fetch(`https://${this.env.adobeIO}/profile`, {
        headers: new Headers({ Authorization: `Bearer ${accessToken.token}` }),
      });
      if (ioResp.status === 200) {
        const profile = await import('./gnav-profile.js');
        profile.default(blockEl, profileEl, this.toggleMenu, ioResp);
      } else {
        this.decorateSignIn(blockEl, profileEl);
      }
    } else {
      this.decorateSignIn(blockEl, profileEl);
    }
  }

  decorateSignIn = (blockEl, profileEl) => {
    const signIn = blockEl.querySelector('a');
    signIn.classList.add('gnav-signin');
    profileEl.append(signIn);
    profileEl.addEventListener('click', (e) => {
      e.preventDefault();
      window.adobeIMS.signIn();
    });
  }

  /**
   * Toggles menus when clicked directly
   * @param {HTMLElement} el the element to check
   */
  toggleMenu = (el) => {
    const isSearch = el.classList.contains('gnav-search');
    const sameMenu = el === this.state.openMenu;
    if (this.state.openMenu) {
      this.closeMenu();
    }
    if (!sameMenu) {
      this.openMenu(el, isSearch);
    }
  }

  closeMenu = () => {
    this.state.openMenu.classList.remove(IS_OPEN);
    document.removeEventListener('click', this.closeOnDocClick);
    window.removeEventListener('keydown', this.closeOnEscape);
    const menuToggle = this.state.openMenu.querySelector('[aria-expanded]');
    menuToggle.setAttribute('aria-expanded', false);
    this.curtain.classList.remove(IS_OPEN);
    this.state.openMenu = null;
  }

  openMenu = (el, isSearch) => {
    el.classList.add(IS_OPEN);

    const menuToggle = el.querySelector('[aria-expanded]');
    menuToggle.setAttribute('aria-expanded', true);

    document.addEventListener('click', this.closeOnDocClick);
    window.addEventListener('keydown', this.closeOnEscape);
    if (!isSearch) {
      const desktop = window.matchMedia('(min-width: 1200px)');
      if (desktop.matches) {
        document.addEventListener('scroll', this.closeOnScroll, { passive: true });
      }
    } else {
      this.curtain.classList.add(IS_OPEN);
      el.querySelector('.gnav-search-input').focus();
    }
    this.state.openMenu = el;
  }

  toggleOnSpace = (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      const parentEl = e.target.closest('.has-Menu');
      this.toggleMenu(parentEl);
    }
  }

  closeOnScroll = () => {
    let scrolled;
    if (!scrolled) {
      if (this.state.openMenu) {
        this.toggleMenu(this.state.openMenu);
      }
      scrolled = true;
      document.removeEventListener('scroll', this.closeOnScroll);
    }
  }

  closeOnDocClick = (e) => {
    const closest = e.target.closest(`.${IS_OPEN}`);
    const isCurtain = e.target === this.curtain;
    if ((this.state.openMenu && !closest) || isCurtain) {
      this.toggleMenu(this.state.openMenu);
    }
  }

  closeOnEscape = (e) => {
    if (e.code === 'Escape') {
      this.toggleMenu(this.state.openMenu);
    }
  }
}

async function fetchGnav(url) {
  const resp = await fetch(`${url}.plain.html`);
  const html = await resp.text();
  return html;
}

export default async function init(blockEl) {
  const url = getMetadata('gnav') || '/gnav';
  const html = await fetchGnav(url);
  if (html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      cleanVariations(doc);
      setDomain(doc);
      const gnav = new Gnav(doc.body, blockEl);
      gnav.init();
    } catch (e) {
      debug('Could not great global navigation', e);
    }
  }
}
