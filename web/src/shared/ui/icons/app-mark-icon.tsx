import type { IconProps } from "./icon-props";

// The side shapes use currentColor with fillOpacity 0.5 (in the prototype
// this is the same white at 50%, not a separate colour), so the shade is
// inherited entirely.
export const AppMarkIcon = ({ size = 24, className, ...props }: IconProps) => {
  const height = (size / 32) * 26;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 32 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M7.2 9.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Zm0 1.8c-3.1 0-5.6 2-6.2 4.8-.2.9.5 1.7 1.4 1.7h6.6c-.4-.9-.6-1.9-.6-2.9 0-1.3.3-2.5.9-3.5-.7-.1-1.4-.1-2.1-.1Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <path
        d="M24.8 9.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Zm0 1.8c-.7 0-1.4 0-2.1.1.6 1 .9 2.2.9 3.5 0 1-.2 2-.6 2.9h6.6c.9 0 1.6-.8 1.4-1.7-.6-2.8-3.1-4.8-6.2-4.8Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <path
        d="M16 10.2a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Zm0 2.2c-4.2 0-7.5 2.7-8.3 6.5-.3 1.2.7 2.3 1.9 2.3h12.8c1.2 0 2.2-1.1 1.9-2.3-.8-3.8-4.1-6.5-8.3-6.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
