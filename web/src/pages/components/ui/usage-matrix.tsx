import { SCREENS, USAGE_MATRIX } from "./usage-matrix-data";

const MARK: Record<number, string> = { 0: "·", 1: "●", 2: "○" };
const COLOR: Record<number, string> = {
  0: "text-ink/20",
  1: "text-primary",
  2: "text-ink-a45",
};

export const UsageMatrix = () => (
  <div className="grid grid-cols-[200px_repeat(6,1fr)] text-caption">
    <div className="pb-2.5 font-500 text-ink-a45">Компонент</div>
    {SCREENS.map((screen) => (
      <div key={screen} className="pb-2.5 text-center font-600">
        {screen}
      </div>
    ))}
    {USAGE_MATRIX.map(([name, ...values]) => (
      <div key={name} className="contents">
        <div className="border-t border-ink-a07 py-2.5 font-500 tracking-tight">{name}</div>
        {values.map((value, i) => (
          <div
            key={SCREENS[i]}
            className={`border-t border-ink-a07 py-2.5 text-center font-600 ${COLOR[value]}`}
          >
            {MARK[value]}
          </div>
        ))}
      </div>
    ))}
  </div>
);
