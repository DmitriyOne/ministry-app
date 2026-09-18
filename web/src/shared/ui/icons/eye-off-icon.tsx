import type { IconProps } from "./icon-props";

// Пары к EyeIcon в прототипе нет — перечёркнутый вариант дорисован в той же
// геометрии (viewBox 24, штрих 1.7, круглые окончания).
export const EyeOffIcon = ({ size = 26, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.1" />
    <path d="M4.6 19.4 19.4 4.6" />
  </svg>
);
