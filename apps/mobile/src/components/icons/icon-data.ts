// Figma(ARIN 디자인)에서 내려받은 SVG를 한 줄 XML로 옮긴 것. 아이콘을 더할 때는 같은 형식으로, 색은 currentColor로 둔다.
export const ICONS = {
  home: {
    w: 24,
    h: 24,
    xml: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M3 10.5L12 3L21 10.5V20C21 20.2652 20.8946 20.5196 20.7071 20.7071C20.5196 20.8946 20.2652 21 20 21H15V15H9V21H4C3.73478 21 3.48043 20.8946 3.29289 20.7071C3.10536 20.5196 3 20.2652 3 20V10.5Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  library: {
    w: 24,
    h: 24,
    xml: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M2 4H8C9.06087 4 10.0783 4.42143 10.8284 5.17157C11.5786 5.92172 12 6.93913 12 8V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V4Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M22 4H16C14.9391 4 13.9217 4.42143 13.1716 5.17157C12.4214 5.92172 12 6.93913 12 8V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V4Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  star: {
    w: 24,
    h: 24,
    xml: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  user: {
    w: 24,
    h: 24,
    xml: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M16 8C16 10.2091 14.2091 12 12 12C9.79086 12 8 10.2091 8 8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M4 21C4 18.8783 4.84285 16.8434 6.34315 15.3431C7.84344 13.8429 9.87827 13 12 13C14.1217 13 16.1566 13.8429 17.6569 15.3431C19.1571 16.8434 20 18.8783 20 21" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  chevronRight: {
    w: 18,
    h: 18,
    xml: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.4"><path d="M6.75 13.5L11.25 9L6.75 4.5" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  chevronSmall: {
    w: 14,
    h: 14,
    xml: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M5.25 10.5L8.75 7L5.25 3.5" stroke-width="1.16667" stroke-linecap="round" stroke="currentColor" stroke-opacity="0.6"/></g></svg>',
  },
  chevronRow: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M6 12L10 8L6 4" stroke-width="1.33333" stroke-linecap="round" stroke="currentColor" stroke-opacity="0.4"/></g></svg>',
  },
  arrowUp: {
    w: 20,
    h: 20,
    xml: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M10 15.8333V4.16667M15.8333 10L10 4.16667L4.16667 10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  close: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.45"><path d="M12 4L8 8M8 8L4 12M8 8L4 4M8 8L12 12" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  voice: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M1.33333 6.66667V8.66667" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/><path d="M4 4V11.3333" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/><path d="M6.66667 2V14" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/><path d="M9.33333 5.33333V10" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/><path d="M12 3.33333V12" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/><path d="M14.6667 6.66667V8.66667" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/></g></svg>',
  },
  flame: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M8 1.33333C8.66667 3.66667 11.3333 5 11.3333 8.33333C11.3333 9.21739 10.9821 10.0652 10.357 10.6904C9.7319 11.3155 8.88406 11.6667 8 11.6667C7.11594 11.6667 6.2681 11.3155 5.64298 10.6904C5.01786 10.0652 4.66667 9.21739 4.66667 8.33333C4.66667 7 5.33333 6.06667 6 5.33333C6.13333 6.4 6.66667 7.06667 7.33333 7.33333C7.33333 5.33333 7.33333 3.33333 8 1.33333Z" fill="currentColor"/></g></svg>',
  },
  camera: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M9.66667 2.66667H6.33333L4.66667 4.66667H2.66667C2.31304 4.66667 1.97391 4.80714 1.72386 5.05719C1.47381 5.30724 1.33333 5.64638 1.33333 6V12C1.33333 12.3536 1.47381 12.6928 1.72386 12.9428C1.97391 13.1929 2.31304 13.3333 2.66667 13.3333H13.3333C13.687 13.3333 14.0261 13.1929 14.2761 12.9428C14.5262 12.6928 14.6667 12.3536 14.6667 12V6C14.6667 5.64638 14.5262 5.30724 14.2761 5.05719C14.0261 4.80714 13.687 4.66667 13.3333 4.66667H11.3333L9.66667 2.66667Z" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M10 8.66667C10 9.77124 9.10457 10.6667 8 10.6667C6.89543 10.6667 6 9.77124 6 8.66667C6 7.5621 6.89543 6.66667 8 6.66667C9.10457 6.66667 10 7.5621 10 8.66667Z" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  pencil: {
    w: 14,
    h: 14,
    xml: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M7 11.6667H12.25" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M9.625 2.04167C9.85706 1.8096 10.1718 1.67923 10.5 1.67923C10.8282 1.67923 11.1429 1.8096 11.375 2.04167C11.6071 2.27373 11.7374 2.58848 11.7374 2.91667C11.7374 3.24486 11.6071 3.5596 11.375 3.79167L4.08333 11.0833L1.75 11.6667L2.33333 9.33333L9.625 2.04167Z" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  heart: {
    w: 18,
    h: 18,
    xml: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M14.25 10.5C15.3675 9.405 16.5 8.0925 16.5 6.375C16.5 5.28098 16.0654 4.23177 15.2918 3.45818C14.5182 2.6846 13.469 2.25 12.375 2.25C11.055 2.25 10.125 2.625 9 3.75C7.875 2.625 6.945 2.25 5.625 2.25C4.53098 2.25 3.48177 2.6846 2.70818 3.45818C1.9346 4.23177 1.5 5.28098 1.5 6.375C1.5 8.1 2.625 9.4125 3.75 10.5L9 15.75L14.25 10.5Z" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  heartSmall: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M12.6667 9.33333C13.66 8.36 14.6667 7.19333 14.6667 5.66667C14.6667 4.69421 14.2804 3.76158 13.5927 3.07394C12.9051 2.38631 11.9725 2 11 2C9.82667 2 9 2.33333 8 3.33333C7 2.33333 6.17333 2 5 2C4.02754 2 3.09491 2.38631 2.40728 3.07394C1.71964 3.76158 1.33333 4.69421 1.33333 5.66667C1.33333 7.2 2.33333 8.36667 3.33333 9.33333L8 14L12.6667 9.33333Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  play: {
    w: 20,
    h: 20,
    xml: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M6.66667 4.16667V15.8333L15.8333 10L6.66667 4.16667Z" fill="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  pause: {
    w: 28,
    h: 28,
    xml: '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M10.5 5.83333H8.16667C7.52233 5.83333 7 6.35567 7 7V21C7 21.6443 7.52233 22.1667 8.16667 22.1667H10.5C11.1443 22.1667 11.6667 21.6443 11.6667 21V7C11.6667 6.35567 11.1443 5.83333 10.5 5.83333Z" fill="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M19.8333 5.83333H17.5C16.8557 5.83333 16.3333 6.35567 16.3333 7V21C16.3333 21.6443 16.8557 22.1667 17.5 22.1667H19.8333C20.4777 22.1667 21 21.6443 21 21V7C21 6.35567 20.4777 5.83333 19.8333 5.83333Z" fill="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  back: {
    w: 20,
    h: 20,
    xml: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M12.5 15L7.5 10L12.5 5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  check: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M13.3333 4L6 11.3333L2.66667 8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  progress: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M13.2318 6.95914C13.2984 7.29578 13.3333 7.64381 13.3333 8C13.3333 8.35619 13.2984 8.70422 13.2318 9.04086M12.435 5.03672C12.0456 4.45511 11.5449 3.95436 10.9633 3.56498M9.04086 2.76818C8.70422 2.70158 8.35619 2.66667 8 2.66667C7.64381 2.66667 7.29578 2.70158 6.95914 2.76818M5.03672 3.56498C4.45511 3.95436 3.95436 4.45511 3.56498 5.03672M2.76818 6.95914C2.70158 7.29578 2.66667 7.64381 2.66667 8C2.66667 8.35619 2.70158 8.70422 2.76818 9.04086M3.56498 10.9633C3.95436 11.5449 4.45511 12.0456 5.03672 12.435M6.95914 13.2318C7.29578 13.2984 7.64381 13.3333 8 13.3333C8.35619 13.3333 8.70422 13.2984 9.04086 13.2318M10.9633 12.435C11.5449 12.0456 12.0456 11.5449 12.435 10.9633" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  todo: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M13.3333 8C13.3333 10.9455 10.9455 13.3333 8 13.3333C5.05448 13.3333 2.66667 10.9455 2.66667 8C2.66667 5.05448 5.05448 2.66667 8 2.66667C10.9455 2.66667 13.3333 5.05448 13.3333 8Z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  book: {
    w: 18,
    h: 18,
    xml: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M1.5 3H6C6.79565 3 7.55871 3.31607 8.12132 3.87868C8.68393 4.44129 9 5.20435 9 6V15.75C9 15.1533 8.76295 14.581 8.34099 14.159C7.91903 13.7371 7.34674 13.5 6.75 13.5H1.5V3Z" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M16.5 3H12C11.2044 3 10.4413 3.31607 9.87868 3.87868C9.31607 4.44129 9 5.20435 9 6V15.75C9 15.1533 9.23705 14.581 9.65901 14.159C10.081 13.7371 10.6533 13.5 11.25 13.5H16.5V3Z" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  settings: {
    w: 18,
    h: 18,
    xml: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M3 15.75V10.5M3 10.5H0.75M3 10.5H5.25M3 7.5V2.25M9 15.75V9M9 6V2.25M9 6H6.75M9 6H11.25M15 15.75V12M15 12H12.75M15 12H17.25M15 9V2.25" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  repeat: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M11.3333 1.33333L14 4L11.3333 6.66667" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M2 7.33333V6.66667C2 5.95942 2.28095 5.28115 2.78105 4.78105C3.28115 4.28095 3.95942 4 4.66667 4H14" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M4.66667 14.6667L2 12L4.66667 9.33333" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M14 8.66667V9.33333C14 10.0406 13.719 10.7189 13.219 11.219C12.7189 11.719 12.0406 12 11.3333 12H2" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  back10: {
    w: 26,
    h: 26,
    xml: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M3.25 13C3.24796 15.2328 4.01235 17.3987 5.41539 19.1356C6.81844 20.8725 8.77513 22.0752 10.9584 22.5428C13.1418 23.0103 15.4194 22.7143 17.4107 21.7042C19.4019 20.6941 20.9862 19.0312 21.8987 16.9934C22.8111 14.9555 22.9965 12.6662 22.4238 10.5081C21.8511 8.35001 20.5551 6.45385 18.7523 5.13654C16.9495 3.81924 14.7491 3.16062 12.519 3.27076C10.289 3.3809 8.16424 4.25313 6.5 5.74167L3.25 8.66667" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M3.25 3.25V8.66667H8.66667" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  forward10: {
    w: 26,
    h: 26,
    xml: '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M22.75 13C22.752 15.2328 21.9877 17.3987 20.5846 19.1356C19.1816 20.8725 17.2249 22.0752 15.0416 22.5428C12.8582 23.0103 10.5806 22.7143 8.58934 21.7042C6.59806 20.6941 5.0138 19.0312 4.10133 16.9934C3.18886 14.9555 3.00348 12.6662 3.57617 10.5081C4.14886 8.35001 5.44492 6.45385 7.24773 5.13654C9.05054 3.81924 11.2509 3.16062 13.481 3.27076C15.711 3.3809 17.8358 4.25313 19.5 5.74167L22.75 8.66667" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M22.75 3.25V8.66667H17.3333" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  music: {
    w: 24,
    h: 24,
    xml: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M9 18V5L21 3V16" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15C7.65685 15 9 16.3431 9 18Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M21 16C21 17.6569 19.6569 19 18 19C16.3431 19 15 17.6569 15 16C15 14.3431 16.3431 13 18 13C19.6569 13 21 14.3431 21 16Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  search: {
    w: 18,
    h: 18,
    xml: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M13.5 8.25C13.5 11.1495 11.1495 13.5 8.25 13.5C5.35051 13.5 3 11.1495 3 8.25C3 5.35051 5.35051 3 8.25 3C11.1495 3 13.5 5.35051 13.5 8.25Z" stroke-width="1.5" stroke-linecap="round" stroke="currentColor"/><path d="M15 15L12.375 12.375" stroke-width="1.5" stroke-linecap="round" stroke="currentColor"/></g></svg>',
  },
  gear: {
    w: 22,
    h: 22,
    xml: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M13.75 11C13.75 12.5188 12.5188 13.75 11 13.75C9.48122 13.75 8.25 12.5188 8.25 11C8.25 9.48122 9.48122 8.25 11 8.25C12.5188 8.25 13.75 9.48122 13.75 11Z" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M17.7833 13.75C17.6676 14.0227 17.632 14.3228 17.6807 14.615C17.7294 14.9073 17.8604 15.1796 18.0583 15.4L18.15 15.4917C18.3601 15.6493 18.5339 15.8502 18.6597 16.0808C18.7854 16.3114 18.8601 16.5664 18.8787 16.8284C18.8973 17.0904 18.8594 17.3533 18.7676 17.5994C18.6758 17.8455 18.5321 18.069 18.3464 18.2547C18.1606 18.4404 17.9372 18.5841 17.6911 18.6759C17.445 18.7678 17.182 18.8057 16.92 18.7871C16.658 18.7684 16.4031 18.6937 16.1725 18.568C15.9418 18.4423 15.7409 18.2685 15.5833 18.0583L15.4917 17.9667C15.2712 17.7687 14.9989 17.6377 14.7067 17.589C14.4145 17.5403 14.1144 17.5759 13.8417 17.6917C13.5753 17.8119 13.3481 18.0045 13.1861 18.2477C13.024 18.4908 12.9335 18.7746 12.925 19.0667V19.25C12.925 19.7362 12.7318 20.2025 12.388 20.5464C12.0442 20.8902 11.5779 21.0833 11.0917 21.0833C10.6054 21.0833 10.1391 20.8902 9.7953 20.5464C9.45149 20.2025 9.25833 19.7362 9.25833 19.25V19.1583C9.24203 18.856 9.13798 18.5649 8.95891 18.3207C8.77983 18.0765 8.53349 17.8898 8.25 17.7833C7.97728 17.6676 7.67721 17.632 7.38497 17.6807C7.09274 17.7294 6.82044 17.8604 6.6 18.0583L6.50833 18.15C6.35073 18.3601 6.14982 18.5339 5.9192 18.6597C5.68858 18.7854 5.43363 18.8601 5.17163 18.8787C4.90963 18.8973 4.64668 18.8594 4.40059 18.7676C4.15451 18.6758 3.93104 18.5321 3.7453 18.3464C3.55957 18.1606 3.41592 17.9372 3.32407 17.6911C3.23222 17.445 3.19433 17.182 3.21295 16.92C3.23157 16.658 3.30627 16.4031 3.43199 16.1725C3.55772 15.9418 3.73153 15.7409 3.94167 15.5833L4.03333 15.4917C4.23128 15.2712 4.36228 14.9989 4.41099 14.7067C4.45969 14.4145 4.42408 14.1144 4.30833 13.8417C4.18814 13.5753 3.99548 13.3481 3.75235 13.1861C3.50922 13.024 3.22541 12.9335 2.93333 12.925H2.75C2.26377 12.925 1.79745 12.7318 1.45364 12.388C1.10982 12.0442 0.916666 11.5779 0.916666 11.0917C0.916666 10.6054 1.10982 10.1391 1.45364 9.7953C1.79745 9.45149 2.26377 9.25833 2.75 9.25833H2.84167C3.14404 9.24203 3.43512 9.13798 3.67931 8.95891C3.9235 8.77983 4.11023 8.53349 4.21667 8.25C4.33242 7.97728 4.36803 7.67721 4.31932 7.38497C4.27062 7.09274 4.13961 6.82044 3.94167 6.6L3.85 6.50833C3.63987 6.35073 3.46605 6.14982 3.34033 5.9192C3.2146 5.68858 3.1399 5.43363 3.12128 5.17163C3.10266 4.90963 3.14056 4.64668 3.2324 4.40059C3.32425 4.15451 3.46791 3.93104 3.65364 3.7453C3.83937 3.55957 4.06284 3.41592 4.30893 3.32407C4.55501 3.23222 4.81796 3.19433 5.07996 3.21295C5.34197 3.23157 5.59691 3.30627 5.82753 3.43199C6.05815 3.55772 6.25907 3.73153 6.41667 3.94167L6.50833 4.03333C6.72877 4.23128 7.00107 4.36228 7.29331 4.41099C7.58555 4.45969 7.88561 4.42408 8.15833 4.30833H8.25C8.51634 4.18814 8.74352 3.99548 8.90561 3.75235C9.06769 3.50922 9.15816 3.22541 9.16667 2.93333V2.75C9.16667 2.26377 9.35982 1.79745 9.70364 1.45364C10.0475 1.10982 10.5138 0.916666 11 0.916666C11.4862 0.916666 11.9525 1.10982 12.2964 1.45364C12.6402 1.79745 12.8333 2.26377 12.8333 2.75V2.84167C12.8418 3.13375 12.9323 3.41755 13.0944 3.66068C13.2565 3.90381 13.4837 4.09647 13.75 4.21667C14.0227 4.33242 14.3228 4.36803 14.615 4.31932C14.9073 4.27062 15.1796 4.13961 15.4 3.94167L15.4917 3.85C15.6493 3.63987 15.8502 3.46605 16.0808 3.34033C16.3114 3.2146 16.5664 3.1399 16.8284 3.12128C17.0904 3.10266 17.3533 3.14056 17.5994 3.2324C17.8455 3.32425 18.069 3.46791 18.2547 3.65364C18.4404 3.83937 18.5841 4.06284 18.6759 4.30893C18.7678 4.55501 18.8057 4.81796 18.7871 5.07996C18.7684 5.34197 18.6937 5.59691 18.568 5.82753C18.4423 6.05815 18.2685 6.25907 18.0583 6.41667L17.9667 6.50833C17.7687 6.72877 17.6377 7.00107 17.589 7.29331C17.5403 7.58555 17.5759 7.88561 17.6917 8.15833V8.25C17.8119 8.51634 18.0045 8.74352 18.2477 8.90561C18.4908 9.06769 18.7746 9.15816 19.0667 9.16667H19.25C19.7362 9.16667 20.2025 9.35982 20.5464 9.70364C20.8902 10.0475 21.0833 10.5138 21.0833 11C21.0833 11.4862 20.8902 11.9525 20.5464 12.2964C20.2025 12.6402 19.7362 12.8333 19.25 12.8333H19.1583C18.8663 12.8418 18.5824 12.9323 18.3393 13.0944C18.0962 13.2565 17.9035 13.4837 17.7833 13.75Z" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  edit: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M11.3333 2C11.5084 1.8249 11.7163 1.68601 11.9451 1.59125C12.1738 1.49649 12.419 1.44772 12.6667 1.44772C12.9143 1.44772 13.1595 1.49649 13.3883 1.59125C13.617 1.68601 13.8249 1.8249 14 2C14.1751 2.1751 14.314 2.38296 14.4088 2.61174C14.5035 2.84051 14.5523 3.08571 14.5523 3.33333C14.5523 3.58096 14.5035 3.82615 14.4088 4.05493C14.314 4.2837 14.1751 4.49157 14 4.66667L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 2Z" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" stroke-opacity="0.5"/></g></svg>',
  },
  plus: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M8 3.33333V8M8 8V12.6667M8 8H3.33333M8 8H12.6667" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/></g></svg>',
  },
  plusSmall: {
    w: 14,
    h: 14,
    xml: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M7 2.91667V7M7 7V11.0833M7 7H2.91667M7 7H11.0833" stroke-width="1.46667" stroke-linecap="round" stroke="currentColor"/></g></svg>',
  },
  remove: {
    w: 14,
    h: 14,
    xml: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.45"><path d="M10.5 3.5L7 7M7 7L3.5 10.5M7 7L3.5 3.5M7 7L10.5 10.5" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  removeSmall: {
    w: 12,
    h: 12,
    xml: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M9 3L6 6M6 6L3 9M6 6L3 3M6 6L9 9" stroke-width="1.2" stroke-linecap="round" stroke="currentColor" stroke-opacity="0.5"/></g></svg>',
  },
  refresh: {
    w: 16,
    h: 16,
    xml: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M14 8C14.0013 9.37403 13.5309 10.7069 12.6675 11.7757C11.804 12.8446 10.5999 13.5848 9.25634 13.8725C7.91277 14.1602 6.51115 13.978 5.28575 13.3564C4.06035 12.7349 3.08541 11.7115 2.52389 10.4575C1.96238 9.2034 1.84829 7.79461 2.20072 6.46654C2.55314 5.13847 3.35072 3.9716 4.46014 3.16095C5.56957 2.3503 6.92361 1.945 8.29597 2.01278C9.66834 2.08055 10.9759 2.61731 12 3.53333L14 5.33333" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M14 2V5.33333H10.6667" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  paw: {
    w: 12,
    h: 12,
    xml: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M3 6.1C3.60751 6.1 4.1 5.60751 4.1 5C4.1 4.39249 3.60751 3.9 3 3.9C2.39249 3.9 1.9 4.39249 1.9 5C1.9 5.60751 2.39249 6.1 3 6.1Z" fill="currentColor"/><path d="M5 4.1C5.60751 4.1 6.1 3.60751 6.1 3C6.1 2.39249 5.60751 1.9 5 1.9C4.39249 1.9 3.9 2.39249 3.9 3C3.9 3.60751 4.39249 4.1 5 4.1Z" fill="currentColor"/><path d="M7 4.1C7.60751 4.1 8.1 3.60751 8.1 3C8.1 2.39249 7.60751 1.9 7 1.9C6.39249 1.9 5.9 2.39249 5.9 3C5.9 3.60751 6.39249 4.1 7 4.1Z" fill="currentColor"/><path d="M9 6.1C9.60751 6.1 10.1 5.60751 10.1 5C10.1 4.39249 9.60751 3.9 9 3.9C8.39249 3.9 7.9 4.39249 7.9 5C7.9 5.60751 8.39249 6.1 9 6.1Z" fill="currentColor"/><path d="M6 5.5C4.5 5.5 3 7.25 3 8.5C3 8.89782 3.15804 9.27936 3.43934 9.56066C3.72064 9.84196 4.10218 10 4.5 10C5.1 10 5.5 9.7 6 9.7C6.5 9.7 6.9 10 7.5 10C7.89782 10 8.27936 9.84196 8.56066 9.56066C8.84196 9.27936 9 8.89782 9 8.5C9 7.25 7.5 5.5 6 5.5Z" fill="currentColor"/></g></svg>',
  },
  archive: {
    w: 12,
    h: 12,
    xml: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M2 2H10C10.2761 2 10.5 2.22386 10.5 2.5V4C10.5 4.27614 10.2761 4.5 10 4.5H2C1.72386 4.5 1.5 4.27614 1.5 4V2.5C1.5 2.22386 1.72386 2 2 2Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M2.5 4.5V9.5C2.5 9.63261 2.55268 9.75979 2.64645 9.85355C2.74021 9.94732 2.86739 10 3 10H9C9.13261 10 9.25979 9.94732 9.35355 9.85355C9.44732 9.75979 9.5 9.63261 9.5 9.5V4.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/><path d="M5 6.5H7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  sparkle: {
    w: 12,
    h: 12,
    xml: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M6 0C6.4 3.5 8.5 5.6 12 6C8.5 6.4 6.4 8.5 6 12C5.6 8.5 3.5 6.4 0 6C3.5 5.6 5.6 3.5 6 0Z" fill="currentColor"/></g></svg>',
  },
  moonOutline: {
    w: 64,
    h: 64,
    xml: '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M40 6.66667C35.8601 6.65365 31.7801 7.65541 28.1169 9.5843C24.4538 11.5132 21.3192 14.3104 18.9875 17.7312C16.6557 21.152 15.1978 25.0922 14.7414 29.2069C14.285 33.3216 14.8439 37.4854 16.3693 41.3341C17.8947 45.1828 20.3401 48.599 23.4914 51.2838C26.6427 53.9686 30.404 55.8401 34.4462 56.7347C38.4883 57.6293 42.6881 57.5196 46.678 56.4153C50.6679 55.3109 54.3264 53.2456 57.3333 50.4C51.5339 52.6985 45.059 52.5991 39.3329 50.1237C33.6067 47.6482 29.0985 42.9994 26.8 37.2C24.5015 31.4006 24.6009 24.9256 27.0763 19.1995C29.5518 13.4734 34.2006 8.96521 40 6.66667Z" fill="currentColor" fill-opacity="0.25"/></g></svg>',
  },
  checkSmall: {
    w: 13,
    h: 13,
    xml: '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M10.8333 3.25L4.875 9.20833L2.16667 6.5" stroke-width="0.975" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"/></g></svg>',
  },
  kakao: {
    w: 18,
    h: 18,
    xml: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M9 1.6C4.58 1.6 1 4.42 1 7.9C1 10.14 2.49 12.11 4.73 13.23L3.78 16.71C3.7 17.01 4.04 17.25 4.3 17.08L8.45 14.33C8.63 14.35 8.82 14.36 9 14.36C13.42 14.36 17 11.54 17 8.06C17 4.58 13.42 1.6 9 1.6Z" fill="black" fill-opacity="0.9"/></g></svg>',
  },
  apple: {
    w: 17,
    h: 23,
    xml: '<svg width="17" height="23" viewBox="0 0 17 23" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M14.1091 12.0622C14.1003 10.4375 14.8352 9.2112 16.3227 8.30807C15.4904 7.11719 14.2331 6.46198 12.5729 6.33359C11.0013 6.20964 9.28359 7.25 8.65495 7.25C7.99089 7.25 6.46797 6.37786 5.27266 6.37786C2.80234 6.41771 0.177084 8.34792 0.177084 12.2747C0.177084 13.4346 0.389584 14.6329 0.814584 15.8695C1.38125 17.4943 3.42656 21.4786 5.56042 21.4122C6.67604 21.3857 7.46406 20.6198 8.91615 20.6198C10.324 20.6198 11.0544 21.4122 12.2984 21.4122C14.45 21.3813 16.3005 17.7599 16.8406 16.1307C13.9542 14.7716 14.1091 12.1464 14.1091 12.0622ZM11.6034 4.79297C12.812 3.35859 12.7013 2.0526 12.6659 1.58333C11.599 1.64531 10.3638 2.30938 9.6599 3.12839C8.88516 4.00495 8.42917 5.08958 8.52656 6.31146C9.68203 6.4 10.7357 5.80677 11.6034 4.79297Z" fill="black"/></g></svg>',
  },
} as const;

export type IconName = keyof typeof ICONS;
