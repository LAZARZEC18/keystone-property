// Business details shown on About, Contact and Terms. Leave a value empty to hide it.
export const SITE = {
  businessName: 'Ownaroo',
  // The person behind Ownaroo, shown on About when a name is filled in (photo: a file in site/assets/media)
  owner: { name: '', role: '', bio: '', photo: '', linkedin: '' },
  // registered entity (e.g. 'Ownaroo Pty Ltd' or the sole trader's name) and ABN, once issued
  entity: '',
  abn: '',
  email: 'Keyzing18@gmail.com',
  location: 'Perth, Western Australia',
  governingLaw: 'Western Australia',
  policyUpdated: '28 September 2026',
  // Map tiles. OpenStreetMap's own tile servers are for light use only; before the site gets real traffic,
  // switch to a commercial provider (e.g. MapTiler, Stadia Maps, Thunderforest) by changing this URL and attribution.
  tiles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};
