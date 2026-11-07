import type { ReactNode, SVGProps } from 'react';

export type IconName = 'cart' | 'pin' | 'repeat' | 'ticket' | 'plus' | 'minus' | 'close' | 'trash' | 'sparkle' | 'check' | 'arrow' | 'whatsapp' | 'building' | 'shield' | 'sofa' | 'email' | 'phone' | 'instagram';

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export function Icon({ name, size = 20, ...props }: Props) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.7 };
  const paths: Record<IconName, ReactNode> = {
    cart: <><path d="M2.5 3h2l2.1 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L21 7H6"/><circle cx="9" cy="19" r="1.2"/><circle cx="17" cy="19" r="1.2"/></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    phone: <><path d="M7.2 3.8 9.5 3a1.5 1.5 0 0 1 1.8.8l1.1 2.5a1.5 1.5 0 0 1-.4 1.8l-1.4 1.1a14 14 0 0 0 4.2 4.2l1.1-1.4a1.5 1.5 0 0 1 1.8-.4l2.5 1.1a1.5 1.5 0 0 1 .8 1.8l-.8 2.3a2.5 2.5 0 0 1-2.6 1.7A16.5 16.5 0 0 1 5.5 6.4a2.5 2.5 0 0 1 1.7-2.6Z"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.8" r=".8" fill="currentColor" stroke="none"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/></>,
    repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
    ticket: <><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6Z"/><path d="M13 5v2m0 3v2m0 3v2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <><path d="M5 12h14"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></>,
    sparkle: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    check: <><path d="m5 12 4.2 4.2L19 6.5"/></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    whatsapp: <><path d="M20 11.5a8.2 8.2 0 0 1-12.1 7.2L4 20l1.3-3.7A8.2 8.2 0 1 1 20 11.5Z"/><path d="M8.4 8.1c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.3l.6 1.5c.1.2.1.4-.1.6l-.5.6c-.1.2-.2.3 0 .6a6.6 6.6 0 0 0 2.3 2c.3.2.4.2.6 0l.7-.8c.2-.2.3-.2.6-.1l1.4.7c.2.1.3.2.3.4v.4c0 .2-.1.5-.4.7-.4.3-1 .5-1.7.4-1.1-.2-2.5-.9-3.7-2-1.1-1-1.9-2.4-2.1-3.3-.2-.8 0-1.3.5-1.6Z"/></>,
    building: <><path d="M3 21h18M5 21V6l7-3 7 3v15M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4"/></>,
    shield: <><path d="M12 3 19 6v5c0 4.7-2.9 8.4-7 10-4.1-1.6-7-5.3-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    sofa: <><path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M3 11a2 2 0 0 1 4 0v4h10v-4a2 2 0 0 1 4 0v7H3v-7Z"/><path d="M5 18v2m14-2v2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...common} {...props}>{paths[name]}</svg>;
}
