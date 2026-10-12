import type { ReactNode } from "react";
import { site } from "../content";
import { cx } from "./ui";

export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cx("size-4 shrink-0", className)}>
      <path d="M12 .75a11.25 11.25 0 0 0-3.558 21.922c.563.104.768-.244.768-.542 0-.267-.01-.974-.015-1.912-3.13.68-3.79-1.51-3.79-1.51-.512-1.3-1.25-1.646-1.25-1.646-1.023-.7.078-.685.078-.685 1.13.08 1.725 1.16 1.725 1.16 1.005 1.722 2.637 1.225 3.28.937.102-.728.393-1.225.715-1.507-2.5-.284-5.129-1.25-5.129-5.565 0-1.23.44-2.234 1.16-3.02-.117-.284-.503-1.43.11-2.98 0 0 .944-.302 3.094 1.154A10.79 10.79 0 0 1 12 6.177c.956.005 1.918.13 2.816.38 2.148-1.456 3.09-1.154 3.09-1.154.615 1.55.229 2.696.113 2.98.722.786 1.158 1.79 1.158 3.02 0 4.326-2.633 5.278-5.142 5.557.405.35.766 1.043.766 2.1 0 1.517-.014 2.741-.014 3.113 0 .3.203.65.774.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  );
}

export function GitHubLink({ href = site.repoUrl, children, className }: { href?: string; children?: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={children ? undefined : "View source on GitHub"} title={children ? undefined : "View source on GitHub"} className={cx("inline-flex items-center gap-2 rounded-md font-medium underline-offset-4 hover:underline", className)}>
      <GitHubIcon />
      {children}
    </a>
  );
}
