import { decorateAnchors } from '../../scripts.js';

async function fetchFragment(path) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
        return resp.text();
    }
    return null;
};

export default async function init(element) {
    const path = element.querySelector('div > div').textContent;
    const html = await fetchFragment(path);
    if (!html) return;
    element.insertAdjacentHTML('beforeend', html);
    element.querySelector('div').remove();
    element.classList.add('is-Visible');
    decorateAnchors(element);
};